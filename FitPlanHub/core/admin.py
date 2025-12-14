# core/admin.py
from django.contrib import admin
from .models import FitnessPlan, PlanDay, Subscription

class PlanDayInline(admin.TabularInline):
    model = PlanDay
    extra = 1

@admin.register(FitnessPlan)
class FitnessPlanAdmin(admin.ModelAdmin):
    list_display = ('title', 'trainer', 'price', 'duration_days')
    list_filter = ('trainer', 'price')
    inlines = [PlanDayInline]

@admin.register(Subscription)
class SubscriptionAdmin(admin.ModelAdmin):
    list_display = ('user', 'plan', 'purchase_date', 'is_active')
    list_filter = ('is_active', 'purchase_date')

admin.site.register(PlanDay)