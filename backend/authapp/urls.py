from django.urls import path , include
from rest_framework.routers import DefaultRouter
from .views import  CustomUserViewset , RolesViewSet , CustomTokenObtainPairView , auth_StatusViewSet , AvatarViewset , decode_jwt
from rest_framework_simplejwt.views import TokenRefreshView 
from . import views

router = DefaultRouter()
router.register(r'Users', CustomUserViewset)
router.register(r'role' , RolesViewSet)
router.register(r'Status' , auth_StatusViewSet)
router.register(r'Avatar' , AvatarViewset)

urlpatterns = [
    path('', include(router.urls)),
    path('login/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('Users/username/<str:user_username>/', views.get_User_by_username, name='get_User_by_username'),
    # path('logout/',BlacklistTokenView.as_view() , name="BlacklistTokenView")
    path('token/expirecheck/', views.decode_jwt, name='decode_jwt'),
] 
