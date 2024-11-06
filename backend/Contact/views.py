from .serializers import ContactSerializers , statusSerializers ,GroupsSerializers
from .models import status , Contact ,Groupss
from rest_framework  import viewsets
from django.http import JsonResponse
# Create your views here.

class statusViewSet(viewsets.ModelViewSet):
    queryset = status.objects.all()
    serializer_class = statusSerializers

class ContactViweset(viewsets.ModelViewSet):
    queryset = Contact.objects.all()
    serializer_class = ContactSerializers

class GroupsViewset(viewsets.ModelViewSet):
    queryset = Groupss.objects.all()
    serializer_class =GroupsSerializers
    
def get_Contact_by_user(request, user_id):
    Members = Contact.objects.filter(user=user_id)
    members_list = [{"id": userMember.id,
                    "contact_user_id": userMember.contact_user.id,
                    "username": userMember.contact_user.username,
                    "avatar": userMember.contact_user.avatar.name,
                    "contact_first_name": userMember.contact_user.first_name,
                    "contact_last_name": userMember.contact_user.last_name,
                    "contact_No": userMember.contact_user.contact_no,
                    "contact_status": userMember.user.status.name,
                    "status": userMember.status.name,
                    "Profile": userMember.contact_user.Profile.url if userMember.contact_user.Profile else None,
                    "created_at": userMember.created_at,
                    } for userMember in Members]
    return JsonResponse(members_list, safe=False)


def get_Contacts_by_group(request, group_name):
    try:
        group = Groupss.objects.get(name=group_name)
        members = group.members.select_related('status').all()
        members_list = [{
            "id": member.id,
            "username": member.username,
            "avatar": member.avatar.name if member.avatar else '',
            "first_name": member.first_name,
            "last_name": member.last_name,
            "contact_no": member.contact_no if hasattr(member, 'contact_no') else '',
            "status": member.status.name if member.status else '',
        } for member in members]

        return JsonResponse(members_list, safe=False)
        
    except Groupss.DoesNotExist:
        return JsonResponse({"error": "Group not found."}, status=404)
