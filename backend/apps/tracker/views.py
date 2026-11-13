from rest_framework import viewsets, permissions
from .models import DailyLog, BodyMeasurement, FoodEntry
from .serializers import DailyLogSerializer, BodyMeasurementSerializer, FoodEntrySerializer

class DailyLogViewSet(viewsets.ModelViewSet):
    serializer_class = DailyLogSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Зөвхөн тухайн нэвтэрсэн хэрэглэгчийн өдрийн бүртгэлүүдийг харуулна
        return DailyLog.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class BodyMeasurementViewSet(viewsets.ModelViewSet):
    serializer_class = BodyMeasurementSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return BodyMeasurement.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class FoodEntryViewSet(viewsets.ModelViewSet):
    serializer_class = FoodEntrySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Тухайн өдрийн бүртгэлд (daily_log_id) хамаарах хоолнуудыг шүүж болно
        queryset = FoodEntry.objects.filter(daily_log__user=self.request.user)
        daily_log_id = self.request.query_params.get('daily_log', None)
        if daily_log_id is not None:
            queryset = queryset.filter(daily_log_id=daily_log_id)
        return queryset

    def perform_create(self, serializer):
        # Хоол нэмэхэд тухайн өдрийн log-той холбож өгнө
        serializer.save()