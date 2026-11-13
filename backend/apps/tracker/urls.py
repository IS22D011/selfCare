from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import DailyLogViewSet, BodyMeasurementViewSet, FoodEntryViewSet

router = DefaultRouter()
router.register(r'logs', DailyLogViewSet, basename='dailylog')
router.register(r'measurements', BodyMeasurementViewSet, basename='bodymeasurement')
router.register(r'foods', FoodEntryViewSet, basename='foodentry')

urlpatterns = [
    path('', include(router.urls)),
]