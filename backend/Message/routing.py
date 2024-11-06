from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    re_path(r'ws/Message/(?P<user1>[^/]+)/(?P<user2>[^/]+)/$', consumers.ChatConsumer.as_asgi()),
]


