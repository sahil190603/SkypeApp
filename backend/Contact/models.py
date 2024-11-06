from django.db import models
from django.conf import settings



class status (models.Model):
    name = models.CharField(max_length=10 , null= True)

    def __str__(self):
        return self.name

class Contact(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='contacts', on_delete=models.CASCADE)
    contact_user = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='contacted_by', on_delete=models.CASCADE)
    status = models.ForeignKey(status, on_delete=models.CASCADE, default='1')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'contact_user')

    def __str__(self):
        return f"{self.user.username} - {self.contact_user.username}"

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        if not Contact.objects.filter(user=self.contact_user, contact_user=self.user).exists():
            Contact.objects.create(user=self.contact_user, contact_user=self.user, status=self.status)


class Groupss(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    members = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name='group')
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='Group_created', on_delete=models.CASCADE, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name