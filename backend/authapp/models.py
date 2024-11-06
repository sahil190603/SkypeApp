from django.contrib.auth.models import AbstractUser
from django.db import models


class Roles(models.Model):
    name = models.CharField(max_length=10)

    def __str__(self):
         return self.name
     
class auth_Status(models.Model):
    name = models.CharField(max_length=50)

    def __str__(self):
         return self.name
    

class Avatar(models.Model):
    name = models.CharField(max_length=20)

    def __str__(self):
         return self.name


     
class CustomUser(AbstractUser):
    username = models.CharField(max_length=150, unique=True , null=True)
    email = models.EmailField(unique=True  , null= True)
    contact_no = models.CharField(max_length=15 , null=True)
    role = models.ForeignKey(Roles , on_delete=models.CASCADE , default='2' )
    status = models.ForeignKey('authapp.auth_Status', on_delete=models.CASCADE , default='1' , null=True )
    avatar = models.ForeignKey(Avatar , on_delete=models.CASCADE , default= '4' )
    Profile = models.ImageField(upload_to='Profile/pictures/', blank=True, null=True)
    password = models.CharField(max_length=100)

    USERNAME_FIELD = 'username'
    
    def __str__(self):
        return f"{self.first_name} {self.last_name}"
