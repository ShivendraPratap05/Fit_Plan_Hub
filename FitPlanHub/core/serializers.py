# core/serializers.py
from rest_framework import serializers
from .models import FitnessPlan, PlanDay, Subscription
from accounts.serializers import UserSerializer

class PlanDaySerializer(serializers.ModelSerializer):
    class Meta:
        model = PlanDay
        fields = '__all__'

class FitnessPlanSerializer(serializers.ModelSerializer):
    trainer = UserSerializer(read_only=True)
    days = PlanDaySerializer(many=True, read_only=True)
    is_subscribed = serializers.SerializerMethodField()
    
    class Meta:
        model = FitnessPlan
        fields = '__all__'
    
    def get_is_subscribed(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return Subscription.objects.filter(user=request.user, plan=obj, is_active=True).exists()
        return False

class FitnessPlanPreviewSerializer(serializers.ModelSerializer):
    trainer = UserSerializer(read_only=True)
    
    class Meta:
        model = FitnessPlan
        fields = ('id', 'title', 'trainer', 'price', 'preview_description', 'duration_days')

class SubscriptionSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    plan = FitnessPlanSerializer(read_only=True)
    
    class Meta:
        model = Subscription
        fields = '__all__'