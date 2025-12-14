# accounts/urls.py
from django.urls import path
from . import views

urlpatterns = [
    path('register/', views.RegisterView.as_view(), name='register'),
    path('login/', views.LoginView.as_view(), name='login'),
    path('profile/', views.UserProfileView.as_view(), name='profile'),
    path('follow/<int:trainer_id>/', views.FollowTrainerView.as_view(), name='follow-trainer'),
    path('following/', views.FollowingListView.as_view(), name='following-list'),
]