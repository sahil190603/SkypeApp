from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import  Roles , Avatar , auth_Status

User = get_user_model()


class RolesSerializer(serializers.ModelSerializer):
    class Meta:
        model = Roles
        fields = '__all__'
        
class auth_StatusSerializers(serializers.ModelSerializer):
    class Meta:
        model = auth_Status
        fields = '__all__'

class AvatarSerializers(serializers.ModelSerializer):
    class Meta:
        model = Avatar
        fields = '__all__'

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id','username','first_name', 'last_name', 'email','contact_no' , 'role' , 'status' , 'avatar', 'Profile',"password")

    def create(self, validated_data):
        user = User.objects.create_user(**validated_data)
        return user
    
    def update(self, instance, validated_data):
        if 'password' in validated_data:
            instance.set_password(validated_data.pop('password'))
        return super().update(instance, validated_data)


