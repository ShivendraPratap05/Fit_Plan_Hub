# core/views.py
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db.models import Q, Sum, Count
from django.shortcuts import render
from .models import FitnessPlan, PlanDay, Subscription
from accounts.models import CustomUser, Follow
from .serializers import (
    FitnessPlanSerializer, FitnessPlanPreviewSerializer,
    PlanDaySerializer, SubscriptionSerializer
)

# ===== API VIEWS =====

class FitnessPlanListView(generics.ListAPIView):
    permission_classes = [permissions.AllowAny]
    
    def get_serializer_class(self):
        if self.request.user.is_authenticated:
            return FitnessPlanSerializer
        return FitnessPlanPreviewSerializer
    
    def get_queryset(self):
        return FitnessPlan.objects.all().select_related('trainer')

class FitnessPlanDetailView(generics.RetrieveAPIView):
    permission_classes = [permissions.AllowAny]
    
    def get_serializer_class(self):
        if self.request.user.is_authenticated:
            plan = self.get_object()
            if (self.request.user == plan.trainer or 
                Subscription.objects.filter(user=self.request.user, plan=plan, is_active=True).exists()):
                return FitnessPlanSerializer
        return FitnessPlanPreviewSerializer
    
    def get_queryset(self):
        return FitnessPlan.objects.all().select_related('trainer')

class TrainerPlanListView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        if request.user.role != 'trainer':
            return Response({'error': 'Only trainers can view their plans'}, status=403)
        
        plans = FitnessPlan.objects.filter(trainer=request.user)
        serializer = FitnessPlanSerializer(plans, many=True)
        return Response(serializer.data)
    
    def post(self, request):
        if request.user.role != 'trainer':
            return Response({'error': 'Only trainers can create plans'}, status=403)
        
        serializer = FitnessPlanSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(trainer=request.user)
            return Response(serializer.data, status=201)
        
        return Response(serializer.errors, status=400)

class PlanDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def put(self, request, pk):
        try:
            plan = FitnessPlan.objects.get(pk=pk, trainer=request.user)
        except FitnessPlan.DoesNotExist:
            return Response({'error': 'Plan not found or you do not have permission'}, status=404)
        
        serializer = FitnessPlanSerializer(plan, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)
    
    def delete(self, request, pk):
        try:
            plan = FitnessPlan.objects.get(pk=pk, trainer=request.user)
            plan.delete()
            return Response({'message': 'Plan deleted successfully'}, status=204)
        except FitnessPlan.DoesNotExist:
            return Response({'error': 'Plan not found or you do not have permission'}, status=404)

class SubscribePlanView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request, plan_id):
        try:
            plan = FitnessPlan.objects.get(id=plan_id)
            
            # Check if already subscribed
            subscription, created = Subscription.objects.get_or_create(
                user=request.user,
                plan=plan,
                defaults={'is_active': True}
            )
            
            if not created:
                subscription.is_active = True
                subscription.save()
            
            serializer = SubscriptionSerializer(subscription)
            return Response(serializer.data, status=201)
        
        except FitnessPlan.DoesNotExist:
            return Response({'error': 'Plan not found'}, status=404)

class UnsubscribePlanView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request, plan_id):
        try:
            subscription = Subscription.objects.get(
                user=request.user,
                plan_id=plan_id
            )
            subscription.is_active = False
            subscription.save()
            return Response({'message': 'Unsubscribed successfully'})
        
        except Subscription.DoesNotExist:
            return Response({'error': 'Subscription not found'}, status=404)

class UserFeedView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        # Get trainers the user follows
        followed_trainers = Follow.objects.filter(
            follower=request.user
        ).values_list('following_id', flat=True)
        
        # Get plans from followed trainers AND subscribed plans
        feed_plans = FitnessPlan.objects.filter(
            Q(trainer_id__in=followed_trainers) |
            Q(subscriptions__user=request.user, subscriptions__is_active=True)
        ).distinct().select_related('trainer')
        
        serializer = FitnessPlanSerializer(feed_plans, many=True)
        return Response(serializer.data)

class UserSubscriptionsView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        subscriptions = Subscription.objects.filter(
            user=request.user,
            is_active=True
        ).select_related('plan', 'plan__trainer')
        
        serializer = SubscriptionSerializer(subscriptions, many=True)
        return Response(serializer.data)

class PlanDayListView(generics.ListAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = PlanDaySerializer
    
    def get_queryset(self):
        plan_id = self.kwargs['plan_id']
        
        # Check if user has access to this plan
        if self.request.user.role == 'trainer':
            # Trainer can see their own plan days
            return PlanDay.objects.filter(plan_id=plan_id, plan__trainer=self.request.user)
        else:
            # User must be subscribed to see plan days
            if Subscription.objects.filter(
                user=self.request.user,
                plan_id=plan_id,
                is_active=True
            ).exists():
                return PlanDay.objects.filter(plan_id=plan_id)
        
        # No access
        return PlanDay.objects.none()

class TrainerStatsView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        if request.user.role != 'trainer':
            return Response({'error': 'Only trainers can view stats'}, status=403)
        
        # Calculate stats
        total_plans = FitnessPlan.objects.filter(trainer=request.user).count()
        total_subscribers = Subscription.objects.filter(
            plan__trainer=request.user,
            is_active=True
        ).count()
        
        total_earnings = Subscription.objects.filter(
            plan__trainer=request.user,
            is_active=True
        ).aggregate(total=Sum('plan__price'))['total'] or 0
        
        total_followers = Follow.objects.filter(following=request.user).count()
        
        # Get recent subscribers (last 30 days)
        from datetime import datetime, timedelta
        thirty_days_ago = datetime.now() - timedelta(days=30)
        recent_subscribers = Subscription.objects.filter(
            plan__trainer=request.user,
            purchase_date__gte=thirty_days_ago,
            is_active=True
        ).count()
        
        # Get most popular plan
        popular_plan = FitnessPlan.objects.filter(
            trainer=request.user
        ).annotate(
            sub_count=Count('subscriptions')
        ).order_by('-sub_count').first()
        
        return Response({
            'total_plans': total_plans,
            'total_subscribers': total_subscribers,
            'total_earnings': float(total_earnings),
            'total_followers': total_followers,
            'recent_subscribers': recent_subscribers,
            'popular_plan': {
                'title': popular_plan.title if popular_plan else 'No plans yet',
                'subscribers': popular_plan.sub_count if popular_plan else 0
            }
        })

# ===== TRAINERS API =====

class TrainersListView(APIView):
    permission_classes = [permissions.AllowAny]
    
    def get(self, request):
        # Get all trainers
        trainers = CustomUser.objects.filter(role='trainer')
        
        # Get stats for each trainer
        trainer_data = []
        for trainer in trainers:
            plan_count = FitnessPlan.objects.filter(trainer=trainer).count()
            follower_count = Follow.objects.filter(following=trainer).count()
            subscriber_count = Subscription.objects.filter(
                plan__trainer=trainer,
                is_active=True
            ).count()
            
            trainer_data.append({
                'id': trainer.id,
                'username': trainer.username,
                'email': trainer.email,
                'role': trainer.role,
                'bio': trainer.bio,
                'profile_picture': trainer.profile_picture.url if trainer.profile_picture else None,
                'plan_count': plan_count,
                'follower_count': follower_count,
                'subscriber_count': subscriber_count,
                'experience_years': getattr(trainer.trainer_profile, 'experience_years', 0) if hasattr(trainer, 'trainer_profile') else 0,
                'specialization': getattr(trainer.trainer_profile, 'specialization', 'General Fitness') if hasattr(trainer, 'trainer_profile') else 'General Fitness',
                'certification': getattr(trainer.trainer_profile, 'certification', 'Certified') if hasattr(trainer, 'trainer_profile') else 'Certified',
                'rating': 4.5  # Default rating, you can implement rating system
            })
        
        return Response(trainer_data)

class TrainerDetailView(APIView):
    permission_classes = [permissions.AllowAny]
    
    def get(self, request, trainer_id):
        try:
            trainer = CustomUser.objects.get(id=trainer_id, role='trainer')
            
            # Get trainer stats
            plan_count = FitnessPlan.objects.filter(trainer=trainer).count()
            follower_count = Follow.objects.filter(following=trainer).count()
            subscriber_count = Subscription.objects.filter(
                plan__trainer=trainer,
                is_active=True
            ).count()
            
            # Get trainer's plans
            plans = FitnessPlan.objects.filter(trainer=trainer)
            plan_serializer = FitnessPlanPreviewSerializer(plans, many=True)
            
            # Get trainer profile info
            trainer_profile = None
            if hasattr(trainer, 'trainer_profile'):
                trainer_profile = {
                    'experience_years': trainer.trainer_profile.experience_years,
                    'specialization': trainer.trainer_profile.specialization,
                    'certification': trainer.trainer_profile.certification
                }
            
            return Response({
                'trainer': {
                    'id': trainer.id,
                    'username': trainer.username,
                    'email': trainer.email,
                    'bio': trainer.bio,
                    'profile_picture': trainer.profile_picture.url if trainer.profile_picture else None,
                    'joined_date': trainer.date_joined
                },
                'stats': {
                    'plan_count': plan_count,
                    'follower_count': follower_count,
                    'subscriber_count': subscriber_count
                },
                'profile': trainer_profile,
                'plans': plan_serializer.data,
                'is_following': Follow.objects.filter(follower=request.user, following=trainer).exists() if request.user.is_authenticated else False
            })
            
        except CustomUser.DoesNotExist:
            return Response({'error': 'Trainer not found'}, status=404)

# ===== PROGRESS TRACKING =====

class ProgressTrackingView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        # Get user's subscriptions
        subscriptions = Subscription.objects.filter(
            user=request.user,
            is_active=True
        ).select_related('plan')
        
        # Calculate progress data
        total_plans = subscriptions.count()
        total_days = sum(sub.plan.duration_days for sub in subscriptions)
        
        # Mock progress data (you can replace with real data)
        progress_data = {
            'total_plans': total_plans,
            'total_days': total_days,
            'completed_days': 45,  # Example data
            'completion_rate': min(100, int((45 / total_days) * 100)) if total_days > 0 else 0,
            'streak_days': 7,  # Current streak
            'longest_streak': 21,
            'calories_burned': 12500,
            'workouts_completed': 32,
            'weight_loss': 3.2,  # kg
            'muscle_gain': 1.5,  # kg
            'weekly_progress': [
                {'week': 'Week 1', 'workouts': 5, 'calories': 1800},
                {'week': 'Week 2', 'workouts': 6, 'calories': 2100},
                {'week': 'Week 3', 'workouts': 7, 'calories': 2400},
                {'week': 'Week 4', 'workouts': 6, 'calories': 2200},
            ]
        }
        
        return Response(progress_data)

# ===== FRONTEND VIEWS =====

def spa_view(request):
    """
    Serve the Single Page Application.
    This view handles ALL frontend routes.
    """
    return render(request, 'spa.html')