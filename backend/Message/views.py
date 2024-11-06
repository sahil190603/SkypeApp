from .serializers import MessageSerializers ,GroupMessagesSerializers
from .models import Message ,GroupChats
from rest_framework  import viewsets
from django.db.models import Max, Q, OuterRef, Subquery, F
from django.http import HttpResponse, Http404, JsonResponse
from django.shortcuts import get_object_or_404
from django.views.decorators.http import require_GET , require_http_methods
import mimetypes
from Contact.models import Groupss
import os
from django.contrib.auth import get_user_model

User = get_user_model()

class MessageViewSet(viewsets.ModelViewSet):
    queryset = Message.objects.all().order_by('-id')
    serializer_class = MessageSerializers

class GroupMessagesViewSet(viewsets.ModelViewSet):
    queryset = GroupChats.objects.all().order_by('-id')
    serializer_class = GroupMessagesSerializers


def get_Messages_by_user_and_reciver(request, user_id, recipient_id):

    messages_from_user_to_recipient = Message.objects.filter(
        sender=user_id, recipient=recipient_id
    )

    messages_from_recipient_to_user = Message.objects.filter(
        sender=recipient_id, recipient=user_id
    )
    all_messages = messages_from_user_to_recipient | messages_from_recipient_to_user
    
    serialized_messages = [{
        "id": message.id,
        "message": message.content,
        "sender": message.sender.username,
        "recipient": message.recipient.username,
        "file": message.file.url if message.file else None,  
        "file_name": message.file.name.split('/')[-1] if message.file else None,
        "image": message.image.url if message.image else None,
        "timestamp": message.timestamp.strftime('%Y-%m-%d %H:%M:%S'),
        "thumbnail": message.thumbnail.url if message.thumbnail else None,
        "is_read": message.is_read,
        "is_download" : message.is_download,
        "reply_to" : message.reply_to.id if message.reply_to else None,
        "Forward_to" : message.Forward_to.id if message.Forward_to else None,
    } for message in all_messages]
    
    return JsonResponse({"messages": serialized_messages})


def download_file(request, message_id):
    group_id = request.GET.get('group_id')
    message = None

    if group_id:
        message = get_object_or_404(GroupChats, id=message_id, group_id=group_id)
        if not message.file and not message.image:
            raise Http404("File or image does not exist in group chat")
        file_path = message.file.path if message.file else message.image.path
        file_name = message.file.name.split('/')[-1] if message.file else message.image.name.split('/')[-1]
        content_type = mimetypes.guess_type(file_path)[0] or 'application/octet-stream'
    
    else:
        message = get_object_or_404(Message, id=message_id)
        if not message.file and not message.image:
            raise Http404("File or image does not exist")
        file_path = message.file.path if message.file else message.image.path
        file_name = message.file.name.split('/')[-1] if message.file else message.image.name.split('/')[-1]
        content_type = mimetypes.guess_type(file_path)[0] or 'application/octet-stream'
        
    try:
        if not os.path.exists(file_path):
            raise FileNotFoundError
        
        with open(file_path, 'rb') as file:
            response = HttpResponse(file.read(), content_type=content_type)
            response['Content-Disposition'] = f'attachment; filename="{file_name}"'
            return response
    except FileNotFoundError:
        raise Http404("File or image not found")


def get_messages_by_user_as_recipient(request, user_id, recipient_id):
    messages = Message.objects.filter(sender=user_id, recipient=recipient_id)

    messages.update(is_read=True)

    message_list = [{
        "id": message.id,
        "sender": message.sender.username,
        "recipient": message.recipient.username,
        "is_read": message.is_read,
    } for message in messages]

    return JsonResponse(message_list, safe=False)


@require_GET
def get_max_read_message_id(request, sender_id, recipient_id):
    try:
        sender_id = int(sender_id)
        recipient_id = int(recipient_id)    
        
        min_id = Message.objects.filter(
            sender_id=sender_id,
            recipient_id=recipient_id,
            is_read=True
        ).aggregate(min_id=Max('id'))['min_id']
        
        return JsonResponse({'max_read_message_id': (min_id) })

    except ValueError:
        return JsonResponse({'error': 'Invalid input'}, status=400)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


@require_http_methods(["GET"])
def get_message_by_id(request, message_id):
    try:
        message = Message.objects.get(id=message_id)
        message_data = {
            "id": message.id,
            "sender": {
                "id": message.sender.id,
                "username": message.sender.username,
                "first_name": message.sender.first_name,
                "last_name": message.sender.last_name,
            },
            "recipient": {
                "id": message.recipient.id,
                "username": message.recipient.username,
                "first_name": message.recipient.first_name,
                "last_name": message.recipient.last_name,
            },
            "content": message.content,
            "timestamp": message.timestamp,
            "is_read": message.is_read,
            "file": message.file.url if message.file else None,
            "image": message.image.url if message.image else None,
            "thumbnail": message.thumbnail.url if message.thumbnail else None,
            "reply_to": message.reply_to.id if message.reply_to else None,
            "Forward_to": message.Forward_to.id if message.Forward_to else None,
        }

        return JsonResponse(message_data, safe=False)

    except Message.DoesNotExist:
        raise Http404("Message does not exist")


def get_messages_by_group_name(request, group_name):
    group = get_object_or_404(Groupss, name=group_name)
    group_messages = GroupChats.objects.filter(group=group).select_related('sender').order_by('timestamp')

    group_messages_data = []
    for message in group_messages:
        group_messages_data.append({
            'id': message.id,
            'sender_id': message.sender.id,
            'sender': message.sender.username,
            'contact_first_name': message.sender.first_name,
            'contact_last_name' : message.sender.last_name,
            'content': message.content,
            'avatar': message.sender.avatar.name,
            'file': message.file.url if message.file else None,
            'image': message.image.url if message.image else None,
            'thumbnail': message.thumbnail.url if message.thumbnail else None,
            'timestamp': message.timestamp,
            'is_download': message.is_download,
            'reply_to': message.reply_to.id if message.reply_to else None,
            'forward_to': message.Forward_to.id if message.Forward_to else None,
        })

    return JsonResponse(group_messages_data, safe=False)

def mark_Gmessages_as_read(request, group_name):
    group = get_object_or_404(Groupss, name=group_name)
    group_messages = GroupChats.objects.filter(group=group).select_related('sender')
    user_id = request.GET.get('user_id')
    if not user_id:
        return JsonResponse({'error': 'user_id is required'}, status=400)

    user = get_object_or_404(User, id=user_id)

    for message in group_messages:
        if not message.is_read_by.filter(id=user_id).exists():
            message.is_read_by.add(user)

    return JsonResponse({'status': 'success'}, status=200)

def get_users_max_seen_message_ids(request, group_name):
    try:
        group = Groupss.objects.get(name=group_name)
        exclude_user_id = request.GET.get('user_id')
        users = User.objects.filter(sent_group_messages__group=group).distinct()

        user_max_seen_message_ids = {}

        for user in users:
            if str(user.id) == exclude_user_id:
                continue

            max_seen_message = GroupChats.objects.filter(
                group=group,
                is_read_by=user
            ).aggregate(max_id=Max('id'))

            max_seen_message_id = max_seen_message['max_id']

            user_max_seen_message_ids[user.id] = {
                'max_seen_message_id': max_seen_message_id,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'avatar': user.avatar.name if user.avatar else None,  
            }

        return JsonResponse(user_max_seen_message_ids)

    except Groupss.DoesNotExist:
        return JsonResponse({'error': 'Group not found'}, status=404)


def get_latest_Message_for_chat(request, user_id):
    latest_messages_ids = Message.objects.filter(
        Q(sender=user_id) | Q(recipient=user_id)
    ).values(
        'sender', 'recipient'
    ).annotate(
        latest_message_id=Max('id')
    ).values_list('latest_message_id', flat=True)

    latest_messages = Message.objects.filter(
        id__in=latest_messages_ids
    ).select_related('recipient', 'sender').order_by('-id')

    latest_messages_dict = {}
    for message in latest_messages:
        if message.sender.id == user_id:
            contact_user_id = message.recipient.id
        else:
            contact_user_id = message.sender.id

        if contact_user_id not in latest_messages_dict:
            latest_messages_dict[contact_user_id] = message

    direct_messages_data = []
    for message in latest_messages_dict.values():
        if message.sender.id == user_id:
            contact_user_id = message.recipient.id
            contact_user = message.recipient
        else:
            contact_user_id = message.sender.id
            contact_user = message.sender

        unseen_message_count = Message.objects.filter(
            sender=contact_user_id, 
            recipient=user_id, 
            is_read=False
        ).count()

        content = message.content
        if content is None and message.Forward_to:
            try:
                quoted_message = f"quoted message"
            except Message.DoesNotExist:
                quoted_message = "Forwarded message not found"
        else:
            quoted_message = content

        direct_messages_data.append({
            "id": message.id,
            "contact_user_id": contact_user_id,
            "content": quoted_message,
            "username": contact_user.username,
            "avatar": contact_user.avatar.name,
            "contact_first_name": contact_user.first_name,
            "contact_last_name": contact_user.last_name,
            "contact_No": contact_user.contact_no,
            "status": contact_user.status.name,
            "file_name": (
                message.file.name.split('/')[-1] if message.file 
                else (message.image.name.split('/')[-1] if message.image else "None")
            ),
            "timestamp": message.timestamp,
            "unseen_message_count": unseen_message_count,
        })

    user_groups = Groupss.objects.filter(members__id=user_id)
    
    latest_group_messages_ids = GroupChats.objects.filter(
        group__in=user_groups
    ).values(
        'group'
    ).annotate(
        latest_message_id=Max('id')
    ).values_list('latest_message_id', flat=True)

    latest_group_messages = GroupChats.objects.filter(
        id__in=latest_group_messages_ids
    ).select_related('group', 'sender').order_by('-timestamp')

    group_messages_data = []
    for message in latest_group_messages:
        group = message.group
        group_member_count = group.members.count()

        unseen_group_messages_count = GroupChats.objects.filter(
            group=group,
            id__lte=message.id, 
        ).exclude(
            is_read_by__in=[user_id] 
        ).count()

        group_messages_data.append({
            'group_id': message.group.id,
            'group_name': message.group.name,
            'sender_id': message.sender.id,
            'sender_name': message.sender.username,
            "contact_first_name": contact_user.first_name,
            'content': message.content,
            'avatar': message.sender.avatar.name,
            "file_name": (
                message.file.name.split('/')[-1] if message.file 
                else (message.image.name.split('/')[-1] if message.image else "None")
            ),
            'thumbnail': message.thumbnail.url if message.thumbnail else None,
            'timestamp': message.timestamp,
            'reply_to': message.reply_to.id if message.reply_to else None,
            'forward_to': message.Forward_to.id if message.Forward_to else None,
            'group_member_count': group_member_count,
            'unseen_message_count': unseen_group_messages_count,
        })

    combined_messages_data = sorted(
        direct_messages_data + group_messages_data,
        key=lambda x: x['timestamp'],
        reverse=True
    )

    return JsonResponse(combined_messages_data, safe=False)


def search_messages(request):
    query = request.GET.get('query', '')  
    user_id = request.GET.get('user', None) 
    results = []
    if user_id:
       
        latest_messages_subquery = Message.objects.filter(
            recipient_id=user_id,
            sender_id=OuterRef('sender_id')
        ).exclude(sender_id=user_id).order_by('-timestamp').values('timestamp')[:1]

        latest_direct_messages = Message.objects.filter(
            recipient_id=user_id
        ).exclude(sender_id=user_id).annotate(
            latest_timestamp=Subquery(latest_messages_subquery)
        ).filter(timestamp=F('latest_timestamp')).select_related('sender', 'recipient').order_by('-timestamp')

        direct_messages_data = [
            {
                'id': message.id,
                'content': message.content,
                'sender': message.sender.username,
                'recipient': message.recipient.username,
                'contact_first_name': message.sender.first_name,
                'contact_last_name': message.sender.last_name,
                'contact_user_id':message.sender.id, 
                'avatar': message.sender.avatar.name,
                'timestamp': message.timestamp,
                'file_name': message.file.name.split('/')[-1] if message.file else None,
                'image_name': message.image.name.split('/')[-1] if message.image else None,
            }
            for message in latest_direct_messages
        ]
        results.extend(direct_messages_data)

        latest_group_subquery = GroupChats.objects.filter(
            group_id=OuterRef('group_id'),
            sender_id=OuterRef('sender_id')
        ).exclude(sender_id=user_id).order_by('-timestamp').values('timestamp')[:1]

        latest_group_messages = GroupChats.objects.filter(
            group__members=user_id
        ).exclude(sender_id=user_id).annotate(
            latest_timestamp=Subquery(latest_group_subquery)
        ).filter(timestamp=F('latest_timestamp')).select_related('sender', 'group').order_by('-timestamp')

        group_messages_data = [
            {
                'Group_m_id': message.id,
                'group_id':message.group.id,
                'content': message.content,
                'sender': message.sender.username,
                'contact_first_name': message.sender.first_name,
                'group_name': message.group.name,
                'avatar': message.sender.avatar.name,
                'timestamp': message.timestamp,
                'file_name': message.file.name.split('/')[-1] if message.file else None,
                'image_name': message.image.name.split('/')[-1] if message.image else None,
            }
            for message in latest_group_messages
        ]
        results.extend(group_messages_data)

    elif query:
        direct_messages = Message.objects.filter(
            Q(content__icontains=query)
        ).select_related('sender', 'recipient').order_by('-timestamp')

        group_messages = GroupChats.objects.filter(
            Q(content__icontains=query)
        ).select_related('sender', 'group').order_by('-timestamp')

        direct_messages_data = [
            {
                'id': message.id,
                'content': message.content,
                'sender': message.sender.username,
                'avatar': message.sender.avatar.name,
                'contact_first_name': message.sender.first_name,
                'contact_last_name': message.sender.last_name,
                'contact_user_id':message.sender.id, 
                'recipient': message.recipient.username,
                'timestamp': message.timestamp,
                'file_name': message.file.name.split('/')[-1] if message.file else None,
                'image_name': message.image.name.split('/')[-1] if message.image else None,
            }
            for message in direct_messages
        ]
        results.extend(direct_messages_data)
        group_messages_data = [
            {
                'Group_m_id': message.id,
                'group_id':message.group.id,
                'content': message.content,
                'sender': message.sender.username,
                'contact_first_name': message.sender.first_name,
                'avatar': message.sender.avatar.name,
                'group_name': message.group.name,
                'timestamp': message.timestamp,
                'file_name': message.file.name.split('/')[-1] if message.file else None,
                'image_name': message.image.name.split('/')[-1] if message.image else None,
            }
            for message in group_messages
        ]
        results.extend(group_messages_data)

    else:
        return JsonResponse({'error': 'No query parameter provided'}, status=400)

    return JsonResponse(results, safe=False)


def get_unique_senders_messages(request, user_id):
    if not user_id:
        return JsonResponse({'error': 'User ID is required'}, status=400)
    
    partial_username = request.GET.get('username')

    if partial_username:
        matching_users = User.objects.filter(username__icontains=partial_username)        
        sender_ids = matching_users.values_list('id', flat=True)
    else:
        sender_ids = User.objects.exclude(id=user_id).values_list('id', flat=True)

    latest_message_ids = Message.objects.filter(
        sender_id__in=sender_ids
    ).values('sender').annotate(
        latest_message_id=Subquery(
            Message.objects.filter(
                sender=OuterRef('sender')
            ).order_by('-timestamp').values('id')[:1]
        )
    ).values_list('latest_message_id', flat=True)

    latest_messages = Message.objects.filter(id__in=latest_message_ids).select_related('sender', 'recipient')
    formatted_messages = [
        {
            'id': message.id,
            'sender': message.sender.username if message.sender else 'Unknown',
            'recipient': message.recipient.username if message.recipient else 'Unknown',
            'avatar': message.sender.avatar.name if message.sender and message.sender.avatar else None,
            'username': message.sender.username,
            'content': message.content,
            'contact_user_id':message.sender.id, 
            'contact_first_name': message.sender.first_name,
            'contact_last_name': message.sender.last_name,
            'timestamp': message.timestamp.isoformat(),
            'is_read': message.is_read,
            'file': message.file.url if message.file else None,
            'image': message.image.url if message.image else None,
            'thumbnail': message.thumbnail.url if message.thumbnail else None,
            'is_download': message.is_download,
            'reply_to': message.reply_to.id if message.reply_to else None,
            'Forward_to': message.Forward_to.id if message.Forward_to else None,
            'react': message.react,
        }
        for message in latest_messages
    ]
    return JsonResponse({
        'messages': formatted_messages,
    })


@require_GET
def get_latest_Gmessages(request, user_id, group_name=None):
    if not user_id:
        return JsonResponse({'error': 'User ID is required'}, status=400)

    user_groups = Groupss.objects.filter(members__id=user_id)
    
    if group_name:
        user_groups = user_groups.filter(name__icontains=group_name)

    latest_messages = []
    for group in user_groups:
        latest_message = GroupChats.objects.filter(group=group).order_by('-timestamp').first()
        if latest_message:
            latest_messages.append({
                'id': latest_message.id,
                'group_id': group.id,
                'group_name': group.name,
                'sender': latest_message.sender.username if latest_message.sender else 'Unknown',
                'avatar': latest_message.sender.avatar.name if latest_message.sender and latest_message.sender.avatar else None,
                'content': latest_message.content,
                'contact_first_name': latest_message.sender.first_name,
                'contact_last_name': latest_message.sender.last_name,
                'timestamp': latest_message.timestamp.isoformat(),
                'file_name': latest_message.file.name.split('/')[-1] if latest_message.file else None,
                'image_name': latest_message.image.name.split('/')[-1] if latest_message.image else None,
                'thumbnail': latest_message.thumbnail.url if latest_message.thumbnail else None,
            })

    return JsonResponse({'latest_messages': latest_messages})

