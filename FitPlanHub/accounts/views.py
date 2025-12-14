# accounts/views.py
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate, get_user_model
from django.contrib.auth.hashers import make_password
from .models import CustomUser, Follow, TrainerProfile
from .serializers import (
    UserSerializer, UserRegisterSerializer, 
    FollowSerializer, TrainerProfileSerializer
)
User = get_user_model()

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserRegisterSerializer
    permission_classes = [permissions.AllowAny]
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Create user using the serializer's create method
        user = serializer.save()
        
        # If user is a trainer, create TrainerProfile
        if user.role == 'trainer':
            TrainerProfile.objects.create(user=user)
        
        # Generate tokens
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'user': UserSerializer(user).data
        }, status=status.HTTP_201_CREATED)


class LoginView(APIView):
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        
        user = authenticate(username=username, password=password)
        
        if user:
            refresh = RefreshToken.for_user(user)
            return Response({
                'refresh': str(refresh),
                'access': str(refresh.access_token),
                'user': UserSerializer(user).data
            })
        
        return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)

class UserProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_object(self):
        return self.request.user

class FollowTrainerView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request, trainer_id):
        try:
            trainer = CustomUser.objects.get(id=trainer_id, role='trainer')
            
            if Follow.objects.filter(follower=request.user, following=trainer).exists():
                return Response({'error': 'Already following'}, status=status.HTTP_400_BAD_REQUEST)
            
            follow = Follow.objects.create(follower=request.user, following=trainer)
            serializer = FollowSerializer(follow)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        
        except CustomUser.DoesNotExist:
            return Response({'error': 'Trainer not found'}, status=status.HTTP_404_NOT_FOUND)
    
    def delete(self, request, trainer_id):
        try:
            follow = Follow.objects.get(follower=request.user, following_id=trainer_id)
            follow.delete()
            return Response({'message': 'Unfollowed successfully'}, status=status.HTTP_204_NO_CONTENT)
        
        except Follow.DoesNotExist:
            return Response({'error': 'Not following this trainer'}, status=status.HTTP_404_NOT_FOUND)

class FollowingListView(generics.ListAPIView):
    serializer_class = FollowSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return Follow.objects.filter(follower=self.request.user).select_related('following')