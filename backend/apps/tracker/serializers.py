from rest_framework import serializers
from .models import DailyLog, BodyMeasurement, FoodEntry

class FoodEntrySerializer(serializers.ModelSerializer):
    class Meta:
        model = FoodEntry
        fields = ['id', 'name', 'calories', 'meal_type', 'created_at']

class DailyLogSerializer(serializers.ModelSerializer):
    foods = FoodEntrySerializer(many=True, read_only=True)
    
    class Meta:
        model = DailyLog
        fields = ['id', 'date', 'weight_kg', 'water_ml', 'burned_calories', 'foods']

class BodyMeasurementSerializer(serializers.ModelSerializer):
    class Meta:
        model = BodyMeasurement
        fields = ['id', 'date', 'chest_cm', 'waist_cm', 'hip_cm', 'arm_cm', 'thigh_cm']