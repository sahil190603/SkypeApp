import json
import re
import base64
from channels.generic.websocket import AsyncWebsocketConsumer
from django.contrib.auth import get_user_model
from asgiref.sync import sync_to_async
from django.core.files.base import ContentFile
from .models import Message , GroupChats 
from Contact.models import Groupss
from django.core.exceptions import ObjectDoesNotExist
from channels.db import database_sync_to_async
from django.http import Http404
import mimetypes

User = get_user_model()

class ChatConsumer(AsyncWebsocketConsumer):

    connection_count = {}

    async def connect(self):
        user1 = self.scope['url_route']['kwargs']['user1']
        user2 = self.scope['url_route']['kwargs']['user2']

        sanitized_user1 = re.sub(r'[^a-zA-Z0-9_.-]', '_', user1)
        sanitized_user2 = re.sub(r'[^a-zA-Z0-9_.-]', '_', user2)

        sorted_users = sorted([sanitized_user1, sanitized_user2])
        self.room_name = f"{sorted_users[0]}-{sorted_users[1]}"
        self.room_group_name = f'chat_{self.room_name}'

        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        ChatConsumer.connection_count[self.room_group_name] = ChatConsumer.connection_count.get(self.room_group_name, 0) + 1

        await self.accept()

    async def disconnect(self, close_code):

        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

        if self.room_group_name in ChatConsumer.connection_count:
            ChatConsumer.connection_count[self.room_group_name] -= 1
            if ChatConsumer.connection_count[self.room_group_name] <= 0:
                del ChatConsumer.connection_count[self.room_group_name]

    async def receive(self, text_data):
        try:
            text_data_json = json.loads(text_data)
            action = text_data_json.get('action', 'send')
            message_content = text_data_json.get('message', '')
            message_id = text_data_json.get('message_id')
            sender_username = text_data_json.get('sender')
            receiver_username = text_data_json.get('receiver')
            from_api = text_data_json.get('from_api', False)
            file = text_data_json.get('file')
            image = text_data_json.get('image')
            reply_to_id = text_data_json.get('reply_to')
            forward_to_id = text_data_json.get('Forward_to')  
            group_id = text_data_json.get('group_id')

            if action == 'delete':
                await self.delete_message(message_id , group_id)
            elif action == 'update':
                await self.update_message(message_id, message_content , group_id)
            elif action == 'download':
                await self.handle_download(message_id , group_id) 
            else:
                if group_id:
                    await self.send_group_message(sender_username, message_content, file, image, from_api, message_id, reply_to_id, forward_to_id, group_id)
                else:
                    await self.send_message(sender_username, receiver_username, message_content, file, image, from_api, message_id, reply_to_id, forward_to_id)

        except json.JSONDecodeError as e:
            print(f"JSON decode error: {e}")
            await self.send(text_data=json.dumps({'error': 'Invalid JSON format'}))
        except Exception as e:
            print(f"Error processing message: {e}")
            await self.send(text_data=json.dumps({'error': str(e)}))

    async def save_file_from_base64(self, file_data):
        try:
            file_base64 = file_data['base64']
            file_name = file_data['name']
            
            file_content = base64.b64decode(file_base64)
            
            file_content_file = ContentFile(file_content, name=file_name)
            
            return file_content_file
        except Exception as e:
            print(f"Error saving base64 file: {e}")
            return None

    async def send_message(self, sender_username, receiver_username, message_content, file=None, image=None, from_api=False, message_id=None, reply_to_id=None, forward_to_id=None):
        sender = await sync_to_async(User.objects.get)(username=sender_username)
        receiver = await sync_to_async(User.objects.get)(username=receiver_username)
    
        is_read = ChatConsumer.connection_count.get(self.room_group_name, 0) == 2
        reply_to = None
    
        if reply_to_id:
            reply_to = await sync_to_async(Message.objects.get)(id=reply_to_id)
    
        if message_content and not file and not image:
            message = await sync_to_async(Message.objects.create)(
                sender=sender,
                recipient=receiver,
                content=message_content,
                is_read=is_read,
                reply_to=reply_to,
            )
            response_data = {
                'message': message.content,
                'sender': message.sender.username,
                'receiver': message.recipient.username,
                'timestamp': message.timestamp.strftime('%Y-%m-%d %H:%M:%S'),
                'message_id': message.id,
                'file': None,
                'image': None,
                'thumbnail': None,
                'is_read': message.is_read,
                'is_download': message.is_download,
                'reply_to': reply_to.id if reply_to else None, 
            }
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'chat_message',
                    'message': response_data
                }
            )
            await self.send(text_data=json.dumps(response_data))
    
        if file and not message_content and not image:
            file_obj = await self.save_file_from_base64(file)
            if file_obj:
                message = await sync_to_async(Message.objects.create)(
                    sender=sender,
                    recipient=receiver,
                    file=file_obj,
                    is_read=is_read,
                )
                response_data = {
                    'message': '',
                    'sender': message.sender.username,
                    'receiver': message.recipient.username,
                    'timestamp': message.timestamp.strftime('%Y-%m-%d %H:%M:%S'),
                    'message_id': message.id,
                    'file': message.file.url if message.file else None,
                    'image': None,
                    'thumbnail': message.thumbnail.url if message.thumbnail else None,
                    'is_read': message.is_read,
                    'is_download': message.is_download,
                }
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        'type': 'chat_message',
                        'message': response_data
                    }
                )
                await self.send(text_data=json.dumps(response_data))
    
        if image and not message_content and not file:
            image_obj = await self.save_file_from_base64(image)
            if image_obj:
                message = await sync_to_async(Message.objects.create)(
                    sender=sender,
                    recipient=receiver,
                    image=image_obj,
                    is_read=is_read,
                )
                response_data = {
                    'message': '',
                    'sender': message.sender.username,
                    'receiver': message.recipient.username,
                    'timestamp': message.timestamp.strftime('%Y-%m-%d %H:%M:%S'),
                    'message_id': message.id,
                    'file': None,
                    'image': message.image.url if message.image else None,
                    'thumbnail': message.thumbnail.url if message.thumbnail else None,
                    'is_read': message.is_read,
                    'is_download': message.is_download,
                }
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        'type': 'chat_message',
                        'message': response_data
                    }
                )
                await self.send(text_data=json.dumps(response_data))
    
        if message_content and (file or image):
            text_message = await sync_to_async(Message.objects.create)(
                sender=sender,
                recipient=receiver,
                content=message_content,
                is_read=is_read,
                is_download=False,
            )
            text_response_data = {
                'message': text_message.content,
                'sender': text_message.sender.username,
                'receiver': text_message.recipient.username,
                'timestamp': text_message.timestamp.strftime('%Y-%m-%d %H:%M:%S'),
                'message_id': text_message.id,
                'file': None,
                'image': None,
                'thumbnail': None,
                'is_read': text_message.is_read,
            }
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'chat_message',
                    'message': text_response_data
                }
            )
            await self.send(text_data=json.dumps(text_response_data))
    
            if file:
                file_obj = await self.save_file_from_base64(file)
                if file_obj:
                    file_message = await sync_to_async(Message.objects.create)(
                        sender=sender,
                        recipient=receiver,
                        file=file_obj,
                        is_read=is_read,
                        is_download=False,
                    )
                    file_response_data = {
                        'message': '',
                        'sender': file_message.sender.username,
                        'receiver': file_message.recipient.username,
                        'timestamp': file_message.timestamp.strftime('%Y-%m-%d %H:%M:%S'),
                        'message_id': file_message.id,
                        'file': file_message.file.url if file_message.file else None,
                        'image': None,
                        'thumbnail': file_message.thumbnail.url if file_message.thumbnail else None,
                        'is_read': file_message.is_read,
                        'is_download': file_message.is_download,
                    }
                    await self.channel_layer.group_send(
                        self.room_group_name,
                        {
                            'type': 'chat_message',
                            'message': file_response_data
                        }
                    )
                    await self.send(text_data=json.dumps(file_response_data))
    
            if image:
                image_obj = await self.save_file_from_base64(image)
                if image_obj:
                    image_message = await sync_to_async(Message.objects.create)(
                        sender=sender,
                        recipient=receiver,
                        image=image_obj,
                        is_read=is_read,
                    )
                    image_response_data = {
                        'message': '',
                        'sender': image_message.sender.username,
                        'receiver': image_message.recipient.username,
                        'timestamp': image_message.timestamp.strftime('%Y-%m-%d %H:%M:%S'),
                        'message_id': image_message.id,
                        'file': None,
                        'image': image_message.image.url if image_message.image else None,
                        'thumbnail': image_message.thumbnail.url if image_message.thumbnail else None,
                        'is_read': image_message.is_read,
                        'is_download': image_message.is_download,
                    }
                    await self.channel_layer.group_send(
                        self.room_group_name,
                        {
                            'type': 'chat_message',
                            'message': image_response_data
                        }
                    )
                    await self.send(text_data=json.dumps(image_response_data))
    
    async def send_group_message(self, sender_username, message_content=None, file=None, image=None, from_api=False, message_id=None, reply_to_id=None, forward_to_id=None, group_id=None):
        sender = await sync_to_async(User.objects.get)(username=sender_username)
        group = await sync_to_async(Groupss.objects.get)(id=group_id)
        reply_to = None
        forward_to = None
        if reply_to_id:
            try:
                reply_to = await sync_to_async(GroupChats.objects.get)(id=reply_to_id)
            except ObjectDoesNotExist:
                print(f"Reply message with ID {reply_to_id} does not exist.")
                reply_to = None

        if forward_to_id:
            try:
                forward_to = await sync_to_async(GroupChats.objects.get)(id=forward_to_id)
            except ObjectDoesNotExist:
                print(f"Forwarded message with ID {forward_to_id} does not exist.")
                forward_to = None
        
        # Handle sending just text content
        if message_content and not file and not image:
            message = await sync_to_async(GroupChats.objects.create)(
                sender=sender,
                group=group,
                content=message_content,
                reply_to=reply_to,
                Forward_to=forward_to,
            )
               
            avatar = await database_sync_to_async(lambda: sender.avatar.name)()

            response_data = {
                'message': message.content,
                'sender': message.sender.username,
                'contact_first_name': message.sender.first_name,
                'contact_last_name': message.sender.last_name,
                'group_id': group.id,
                'timestamp': message.timestamp.strftime('%Y-%m-%d %H:%M:%S'),
                'message_id': message.id,
                'file': None,
                'image': None,
                'thumbnail': None,
                'is_read': message.is_read_by is not None,
                'avatar': avatar,  
                'is_download': message.is_download,
                'reply_to': reply_to.id if reply_to else None,
                'Forward_to': forward_to.id if forward_to else None,
            }
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'chat_message',
                    'message': response_data
                }
            )
            await self.send(text_data=json.dumps(response_data))
        # Handle sending only a file
        if file and not message_content and not image:
            # breakpoint()
            file_obj = await self.save_file_from_base64(file)
            if file_obj:
                message = await sync_to_async(GroupChats.objects.create)(
                    sender=sender,
                    group=group,
                    file=file_obj,
                    reply_to=reply_to,
                    Forward_to=forward_to,
                )
                avatar = await database_sync_to_async(lambda: sender.avatar.name)()
                response_data = {
                    'message': '',
                    'sender': message.sender.username,
                    'group_id': group.id,
                    'timestamp': message.timestamp.strftime('%Y-%m-%d %H:%M:%S'),
                    'contact_first_name': message.sender.first_name,
                    'contact_last_name': message.sender.last_name,
                    'message_id': message.id,
                    'file': message.file.url if message.file else None,
                    'image': None,
                    'avatar':avatar,
                    'thumbnail': message.thumbnail.url if message.thumbnail else None,
                    'is_read': message.is_read_by is not None,
                    'is_download': message.is_download,
                    'reply_to': reply_to.id if reply_to else None,
                    'Forward_to': forward_to.id if forward_to else None,
                }
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        'type': 'chat_message',
                        'message': response_data
                    }
                )
                await self.send(text_data=json.dumps(response_data))
        
        # Handle sending only an image
        if image and not message_content and not file:
            image_obj = await self.save_file_from_base64(image)
            if image_obj:
                message = await sync_to_async(GroupChats.objects.create)(
                    sender=sender,
                    group=group,
                    image=image_obj,
                    reply_to=reply_to,
                    Forward_to=forward_to,
                )
                avatar = await database_sync_to_async(lambda: sender.avatar.name)()
                response_data = {
                    'message': '',
                    'sender': message.sender.username,
                    'group_id': group.id,
                    'timestamp': message.timestamp.strftime('%Y-%m-%d %H:%M:%S'),
                    'message_id': message.id,
                    'file': None,
                    'image': message.image.url if message.image else None,
                    'contact_first_name': message.sender.first_name,
                    'contact_last_name': message.sender.last_name,
                    'avatar': avatar,
                    'thumbnail': message.thumbnail.url if message.thumbnail else None,
                    'is_read': message.is_read_by is not None,
                    'is_download': message.is_download,
                    'reply_to': reply_to.id if reply_to else None,
                    'Forward_to': forward_to.id if forward_to else None,
                }
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        'type': 'chat_message',
                        'message': response_data
                    }
                )
                await self.send(text_data=json.dumps(response_data))

        # Handle sending a combination of text and file/image
        if message_content and (file or image):
            # First send the text part
            text_message = await sync_to_async(GroupChats.objects.create)(
                sender=sender,
                group=group,
                content=message_content,
                reply_to=reply_to,
                Forward_to=forward_to,
            )
            avatar = await database_sync_to_async(lambda: sender.avatar.name)()
            text_response_data = {
                'message': text_message.content,
                'sender': text_message.sender.username,
                'group_id': group.id,
                'timestamp': text_message.timestamp.strftime('%Y-%m-%d %H:%M:%S'),
                'contact_first_name': text_message.sender.first_name,
                'contact_last_name': text_message.sender.last_name,
                'message_id': text_message.id,
                'file': None,
                'image': None,
                'thumbnail': None,
                'avatar': avatar,
                'is_read': text_message.is_read_by is not None,
                'is_download': text_message.is_download,
                'reply_to': reply_to.id if reply_to else None,
                'Forward_to': forward_to.id if forward_to else None,
            }
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'chat_message',
                    'message': text_response_data
                }
            )
            await self.send(text_data=json.dumps(text_response_data))

            # Then send the file or image part
            if file:
                file_obj = await self.save_file_from_base64(file)
                if file_obj:
                    file_message = await sync_to_async(GroupChats.objects.create)(
                        sender=sender,
                        group=group,
                        file=file_obj,
                        reply_to=reply_to,
                        Forward_to=forward_to,
                    )
                    avatar = await database_sync_to_async(lambda: sender.avatar.name)()
                    file_response_data = {
                        'message': '',
                        'sender': file_message.sender.username,
                        'group_id': group.id,
                        'timestamp': file_message.timestamp.strftime('%Y-%m-%d %H:%M:%S'),
                        'message_id': file_message.id,
                        'file': file_message.file.url if file_message.file else None,
                        'contact_first_name': file_message.sender.first_name,
                        'contact_last_name': file_message.sender.last_name,
                        'image': None,
                        'avatar': avatar,
                        'thumbnail': file_message.thumbnail.url if file_message.thumbnail else None,
                        'is_read': file_message.is_read_by is not None,
                        'is_download': file_message.is_download,
                        'reply_to': reply_to.id if reply_to else None,
                        'Forward_to': forward_to.id if forward_to else None,
                    }
                    await self.channel_layer.group_send(
                        self.room_group_name,
                        {
                            'type': 'chat_message',
                            'message': file_response_data
                        }
                    )
                    await self.send(text_data=json.dumps(file_response_data))

            if image:
                image_obj = await self.save_file_from_base64(image)
                if image_obj:
                    image_message = await sync_to_async(GroupChats.objects.create)(
                        sender=sender,
                        group=group,
                        image=image_obj,
                        reply_to=reply_to,
                        Forward_to=forward_to,
                    )
                    avatar = await database_sync_to_async(lambda: sender.avatar.name)()
                    image_response_data = {
                        'message': '',
                        'sender': image_message.sender.username,
                        'group_id': group.id,
                        'timestamp': image_message.timestamp.strftime('%Y-%m-%d %H:%M:%S'),
                        'contact_first_name': image_message.sender.first_name,
                        'contact_last_name': image_message.sender.last_name,
                        'message_id': image_message.id,
                        'file': None,
                        'image': image_message.image.url if image_message.image else None,
                        'avatar': avatar,
                        'thumbnail': image_message.thumbnail.url if image_message.thumbnail else None,
                        'is_read': image_message.is_read_by is not None,
                        'is_download': image_message.is_download,
                        'reply_to': reply_to.id if reply_to else None,
                        'Forward_to': forward_to.id if forward_to else None,
                    }
                    await self.channel_layer.group_send(
                        self.room_group_name,
                        {
                            'type': 'chat_message',
                            'message': image_response_data
                        }
                    )
                    await self.send(text_data=json.dumps(image_response_data))

    async def delete_message(self, message_id, group_id):
        try:
            if group_id:
                message = await sync_to_async(GroupChats.objects.get)(id=message_id)
            else:
                message = await sync_to_async(Message.objects.get)(id=message_id)
            
            await sync_to_async(message.delete)()
            
            response_data = {
                'action': 'delete',
                'message_id': message_id,
                'group_id': group_id
            }
            
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'chat_message',
                    'message': response_data,
                }
            )
        except (Message.DoesNotExist, GroupChats.DoesNotExist):
            error_msg = f"Message with id {message_id} does not exist."
            print(error_msg)
            await self.send(text_data=json.dumps({'error': error_msg}))
    
    async def update_message(self, message_id, new_content, group_id):
        is_read = ChatConsumer.connection_count.get(self.room_group_name, 0) == 2
        try:
            if group_id:
                message = await sync_to_async(GroupChats.objects.get)(id=message_id)
            else:
                message = await sync_to_async(Message.objects.get)(id=message_id)
            
            message.content = new_content
            message.is_read = is_read | False
            await sync_to_async(message.save)()
            
            response_data = {
                'action': 'update',
                'message_id': message_id,
                'new_content': new_content,
                'group_id': group_id
            }
            
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'chat_message',
                    'message': response_data
                }
            )
        except (Message.DoesNotExist, GroupChats.DoesNotExist):
            error_msg = f"Message with id {message_id} does not exist."
            print(error_msg)
            await self.send(text_data=json.dumps({'error': error_msg}))

    async def chat_message(self, event):
        message = event['message']
        await self.send(text_data=json.dumps(message))


    async def handle_download(self, message_id, group_id=None):
        try:
            if group_id:
                message = await database_sync_to_async(GroupChats.objects.get)(id=message_id)
            else:
                message = await database_sync_to_async(Message.objects.get)(id=message_id)

            message.is_download = True
            await database_sync_to_async(message.save)()
            response_data = {
                'action': 'download',
                'message_id': message_id,
                'group_id': group_id,
                'is_download': message.is_download,
            }
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'chat_message',
                    'message': response_data,
                }
            )
        except (Message.DoesNotExist, GroupChats.DoesNotExist, ObjectDoesNotExist):
            error_msg = f"Message with id {message_id} does not exist."
            print(error_msg)
            await self.send(text_data=json.dumps({'error': error_msg}))


   