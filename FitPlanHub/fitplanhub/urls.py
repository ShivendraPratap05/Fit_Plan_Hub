# fitplanhub/urls.py
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
from core.views import spa_view  # IMPORT THE SPA VIEW

urlpatterns = [
    # ===== ADMIN =====
    path('admin/', admin.site.urls),
    
    # ===== API ENDPOINTS =====
    
    # JWT Authentication
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # Accounts API
    path('api/accounts/', include('accounts.urls')),
    
    # Core API
    path('api/plans/', include('core.urls')),
    
    # ===== FRONTEND SPA =====
    # All these routes point to the SAME SPA HTML file
    # The JavaScript handles routing on the client side
    
    # Main pages
    path('', spa_view, name='home'),
    path('feed/', spa_view, name='feed'),
    path('plans/', spa_view, name='plans'),
    path('profile/', spa_view, name='profile'),
    path('subscriptions/', spa_view, name='subscriptions'),
    path('trainer/dashboard/', spa_view, name='trainer_dashboard'),
    
    # Auth pages
    path('login/', spa_view, name='login'),
    path('register/', spa_view, name='register'),
    
    # Plan details
    path('plans/<int:plan_id>/', spa_view, name='plan_detail'),
    
    # ===== CATCH-ALL ROUTE =====
    # This MUST be last - catches all other paths for SPA routing
    path('<path:path>/', spa_view, name='spa_catch_all'),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)