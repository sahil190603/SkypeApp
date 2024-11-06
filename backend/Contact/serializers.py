from rest_framework import serializers
from .models import status , Contact , Groupss


class statusSerializers(serializers.ModelSerializer):
    class Meta:
        model = status
        fields = '__all__'

class ContactSerializers(serializers.ModelSerializer):
    class Meta:
        model = Contact
        fields = '__all__'

class GroupsSerializers(serializers.ModelSerializer):
    class Meta:
        model = Groupss
        fields = '__all__'

