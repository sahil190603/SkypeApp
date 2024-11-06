from django.urls import path , include
from rest_framework.routers import DefaultRouter
from .views import  MessageViewSet ,GroupMessagesViewSet
from . import views 
from .views import download_file


router = DefaultRouter()
router.register(r'Message', MessageViewSet)
router.register(r'GMessage', GroupMessagesViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('Message/user/<int:user_id>/', views.get_latest_Message_for_chat, name='get_latest_Message_for_chat'),
    path('Message/user/<int:user_id>/reciver/<int:recipient_id>/', views.get_Messages_by_user_and_reciver, name='get_messages_by_user_and_recipient'),
    path('Message/download/<int:message_id>/', download_file, name='download_file'),
    path('Message/sender/<int:user_id>/reciver/<int:recipient_id>/',views.get_messages_by_user_as_recipient, name='messages-by-user-as-recipient'),
    path('Message/max-read-id/send_by/<int:sender_id>/seen_by/<int:recipient_id>/', views.get_max_read_message_id, name='get_max_read_message_id'),
    path('Message/msg/<int:message_id>/', views.get_message_by_id, name='get_message_by_id'),
    path('GMessage/group/<str:group_name>/', views.get_messages_by_group_name, name='get_messages_by_group_name'),
    path('GMessage/group_seen/<str:group_name>/', views.mark_Gmessages_as_read , name='mark_Gmessages_as_read'),
    path('GMessage/max_seen/<str:group_name>/', views.get_users_max_seen_message_ids, name='get_max_seen_message_id_by_group'),
    path('Message/Message&GMessage/search-messages/', views.search_messages, name='search_messages'),
    path('GMessage/latest-messages/<int:user_id>/', views.get_latest_Gmessages, name='latest_messages'),
    path('Message/unique/<int:user_id>/', views.get_unique_senders_messages, name='unique_senders_messages'),
    path('Message/latest_groupname/<int:user_id>/<str:group_name>/', views.get_latest_Gmessages, name='get_latest_Gmessages_by_group'),
]

