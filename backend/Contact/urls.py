from django.urls import path , include
from rest_framework.routers import DefaultRouter
from .views import  ContactViweset , statusViewSet ,GroupsViewset
from . import views


router = DefaultRouter()
router.register(r'Contact', ContactViweset)
router.register(r'status' , statusViewSet)
router.register(r'Groups', GroupsViewset)

urlpatterns = [
   path('', include(router.urls)),
   path('Contact/user/<int:user_id>/', views.get_Contact_by_user, name='get_Contact_by_user'),
   path('Groups/Group_usersname/<str:group_name>/', views.get_Contacts_by_group , name='get_Contacts_by_group')
]
