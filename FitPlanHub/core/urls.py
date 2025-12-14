# core/urls.py
from django.urls import path
from . import views

urlpatterns = [
    # Plan management
    path('', views.FitnessPlanListView.as_view(), name='plan-list'),
    path('<int:pk>/', views.FitnessPlanDetailView.as_view(), name='plan-detail'),
    path('<int:plan_id>/subscribe/', views.SubscribePlanView.as_view(), name='subscribe-plan'),
    path('<int:plan_id>/unsubscribe/', views.UnsubscribePlanView.as_view(), name='unsubscribe-plan'),
    
    # Trainer endpoints
    path('trainer/plans/', views.TrainerPlanListView.as_view(), name='trainer-plan-list'),
    path('trainer/stats/', views.TrainerStatsView.as_view(), name='trainer-stats'),
    
    # User endpoints
    path('feed/', views.UserFeedView.as_view(), name='user-feed'),
    path('subscriptions/', views.UserSubscriptionsView.as_view(), name='user-subscriptions'),
    
    # Plan days
    path('<int:plan_id>/days/', views.PlanDayListView.as_view(), name='plan-days'),
]