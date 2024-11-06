from django.db import models
from django.conf import settings
from django.core.files.base import ContentFile
from PIL import Image
from io import BytesIO
from pdf2image import convert_from_bytes
from Contact.models import Groupss

class Message(models.Model):
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='sent_messages', on_delete=models.CASCADE, null=True)
    recipient = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='received_messages', on_delete=models.CASCADE, null=True)
    content = models.TextField(null=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    is_read = models.BooleanField(default=False) 
    file = models.FileField(upload_to='messages/files/', blank=True, null=True)
    image = models.ImageField(upload_to='messages/images/', blank=True, null=True)
    thumbnail = models.ImageField(upload_to='messages/thumbnails/', blank=True, null=True)
    is_download = models.BooleanField(default=False)
    reply_to = models.ForeignKey('self', null=True, blank=True, related_name='replies', on_delete=models.SET_NULL)
    Forward_to = models.ForeignKey('self', null=True, blank=True , related_name='Forwards' , on_delete=models.SET_NULL)
    react = models.TextField(null=True)

    def save(self, *args, **kwargs):
        if self.file and self.file.name.endswith('.pdf'):
            try:
                self.generate_pdf_thumbnail()
            except Exception as e:
                print(f"Error generating PDF thumbnail: {e}")
        super().save(*args, **kwargs)

    def generate_pdf_thumbnail(self):
        try:
            poppler_path = r'After installing poppler, Addf popeler path here(F:\Sahil\poppeler\poppler-24.07.0\Library\bin)';

            pdf_content = self.file.read()
    
            images = convert_from_bytes(pdf_content, first_page=1, last_page=1, poppler_path=poppler_path)
            if not images:
                raise Exception("No images returned from convert_from_bytes")
            image = images[0]
    
            thumb_io = BytesIO()
            image.save(thumb_io, format='JPEG')
            file_name = self.file.name.split('/')[-1].replace('.pdf', '.jpg')  
            thumb_file = ContentFile(thumb_io.getvalue(), file_name)
    
            self.thumbnail.save(file_name, thumb_file, save=False)
        except Exception as e:
            print(f"Error processing PDF: {e}")
    
    # def __str__(self):
        # return f"From {self.sender.username} to {self.recipient.username} at {self.timestamp}"

from django.contrib.auth import get_user_model

User = get_user_model()

class GroupChats(models.Model):
    group = models.ForeignKey(Groupss, related_name='messages', on_delete=models.CASCADE)
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='sent_group_messages', on_delete=models.CASCADE, null=True)
    content = models.TextField(null=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    is_read_by = models.ManyToManyField(User, related_name='read_group_messages', blank=True)
    file = models.FileField(upload_to='groups/files/', blank=True, null=True)
    image = models.ImageField(upload_to='groups/images/', blank=True, null=True)
    thumbnail = models.ImageField(upload_to='groups/thumbnails/', blank=True, null=True)
    is_download = models.BooleanField(default=False)
    reply_to = models.ForeignKey('self', null=True, blank=True, related_name='replies', on_delete=models.SET_NULL)
    Forward_to = models.ForeignKey('self', null=True, blank=True, related_name='Forwards', on_delete=models.SET_NULL)
    react = models.TextField(null=True)


    def save(self, *args, **kwargs):
        if self.file and self.file.name.endswith('.pdf'):
            try:
                self.generate_pdf_thumbnail()
            except Exception as e:
                print(f"Error generating PDF thumbnail: {e}")
        super().save(*args, **kwargs)

    def generate_pdf_thumbnail(self):
        try:
            pdf_content = self.file.read()
            images = convert_from_bytes(pdf_content, first_page=1, last_page=1)
            if not images:
                raise Exception("No images returned from convert_from_bytes")
            image = images[0]

            thumb_io = BytesIO()
            image.save(thumb_io, format='JPEG')
            file_name = self.file.name.split('/')[-1].replace('.pdf', '.jpg')
            thumb_file = ContentFile(thumb_io.getvalue(), file_name)

            self.thumbnail.save(file_name, thumb_file, save=False)
        except Exception as e:
            print(f"Error processing PDF: {e}")




