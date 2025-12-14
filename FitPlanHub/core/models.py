# core/models.py
from django.db import models
from accounts.models import CustomUser

class FitnessPlan(models.Model):
    trainer = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='plans')
    title = models.CharField(max_length=200)
    description = models.TextField()
    price = models.DecimalField(max_digits=10, decimal_places=2)
    duration_days = models.IntegerField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Preview fields (shown to non-subscribers)
    preview_description = models.TextField(help_text="Short description shown to non-subscribers")
    
    def __str__(self):
        return self.title

class PlanDay(models.Model):
    plan = models.ForeignKey(FitnessPlan, on_delete=models.CASCADE, related_name='days')
    day_number = models.IntegerField()
    title = models.CharField(max_length=200)
    description = models.TextField()
    exercises = models.TextField()  # JSON-like structure or text
    duration_minutes = models.IntegerField()
    
    class Meta:
        ordering = ['day_number']
    
    def __str__(self):
        return f"{self.plan.title} - Day {self.day_number}"

class Subscription(models.Model):
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='subscriptions')
    plan = models.ForeignKey(FitnessPlan, on_delete=models.CASCADE, related_name='subscriptions')
    purchase_date = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        unique_together = ('user', 'plan')
    
    def __str__(self):
        return f"{self.user.username} subscribed to {self.plan.title}"