# accounts/serializers.py
from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.hashers import make_password
from .models import TrainerProfile, Follow

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'role', 'bio', 'profile_picture')
        read_only_fields = ('id', 'role')

class UserRegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    role = serializers.ChoiceField(choices=[('user', 'User'), ('trainer', 'Trainer')])
    
    class Meta:
        model = User
        fields = ('username', 'email', 'password', 'role')
    
    def create(self, validated_data):
        # Get role from validated data
        role = validated_data.get('role', 'user')
        
        # Create user with role
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
        )
        
        # Set role separately (since create_user doesn't accept custom fields)
        user.role = role
        user.save()
        
        return user

class TrainerProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = TrainerProfile
        fields = '__all__'

class FollowSerializer(serializers.ModelSerializer):
    follower = UserSerializer(read_only=True)
    following = UserSerializer(read_only=True)
    
    class Meta:
        model = Follow
        fields = ('id', 'follower', 'following', 'created_at')