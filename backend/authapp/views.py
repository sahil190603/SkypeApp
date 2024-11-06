from django.contrib.auth import get_user_model
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework  import viewsets , views ,status
from .models import CustomUser , Roles , auth_Status , Avatar
from .serializers import UserSerializer ,  RolesSerializer , auth_StatusSerializers , AvatarSerializers
from django.http import JsonResponse
from rest_framework.response import Response
from rest_framework_simplejwt.token_blacklist.models import BlacklistedToken , OutstandingToken
from rest_framework_simplejwt.tokens import AccessToken , RefreshToken
from rest_framework_simplejwt.exceptions import TokenError
    
class RolesViewSet(viewsets.ModelViewSet):
     queryset = Roles.objects.all()
     serializer_class = RolesSerializer

class CustomUserViewset(viewsets.ModelViewSet):
        queryset = CustomUser.objects.filter(role=2)
        serializer_class = UserSerializer

class auth_StatusViewSet(viewsets.ModelViewSet):
    queryset = auth_Status.objects.all()
    serializer_class = auth_StatusSerializers

class AvatarViewset(viewsets.ModelViewSet):
     queryset = Avatar.objects.all()
     serializer_class = AvatarSerializers

User = get_user_model()


# for took a data in access token
class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['username'] = user.username
        token['role'] = user.role.name
        token['first_name'] = user.first_name
        token['last_name'] = user.last_name
        token['email'] = user.email
        token['contact_no'] = user.contact_no
        token['status'] = user.status.name 
        token['avatar'] = user.avatar.name if user.avatar else None
        token['Profile'] = user.Profile.url if user.Profile else None

        return token

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer
     


def get_User_by_username(request, user_username):
    members = CustomUser.objects.filter(username=user_username)
    members_list = [
        {
            "id": user_member.id,
            "avatar": user_member.avatar.name,
            "username": user_member.username,
            "firstname": user_member.first_name,
            "lastname": user_member.last_name,
            "status": user_member.status.name,
            "created_at": user_member.date_joined,
        }
        for user_member in members
    ]
    return JsonResponse(members_list, safe=False)


# class BlacklistTokenView(views.APIView):
#     def post(self, request, *args, **kwargs):
#         auth_header = request.headers.get('Authorization')
#         if not auth_header or not auth_header.startswith('Bearer '):
#             return Response({"detail": "Authorization header is required."}, status=status.HTTP_400_BAD_REQUEST)

#         token = auth_header.split(' ')[1]  
#         if not token:
#             return Response({"detail": "Token is required."}, status=status.HTTP_400_BAD_REQUEST)

#         try:
#             try:
#                 access_token = AccessToken(token)
#                 token_type = 'access'
#             except TokenError:

#                 refresh_token = RefreshToken(token)
#                 token_type = 'refresh'

#             if token_type == 'access':
#                 outstanding_token = OutstandingToken.objects.get(token=(access_token.token))
#             else:
#                 outstanding_token = OutstandingToken.objects.get(token=str(refresh_token))

#             BlacklistedToken.objects.create(token=outstanding_token)
#             return Response({"detail": "Token successfully blacklisted."}, status=status.HTTP_200_OK)

#         except OutstandingToken.DoesNotExist:
#             return Response({"detail": "Token not found in outstanding tokens."}, status=status.HTTP_404_NOT_FOUND)
#         except TokenError as e:
#             return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)

import jwt
from django.conf import settings
from django.views.decorators.http import require_http_methods

@require_http_methods(["GET"])
def decode_jwt(request):
    token = request.GET.get('token') 
    if not token:
        return JsonResponse({"error": "Token is required"}, status=400)

    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        return JsonResponse(payload)  
    except jwt.ExpiredSignatureError:
        return JsonResponse({"error": "Token has expired"}, status=401)
    except jwt.InvalidTokenError:
        return JsonResponse({"error": "Invalid token"}, status=401)