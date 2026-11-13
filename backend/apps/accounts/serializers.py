from rest_framework import serializers
from django.contrib.auth.models import User
from .models import UserProfile

class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = ['height_cm', 'start_weight', 'target_weight', 'daily_calorie_goal', 'daily_water_goal_ml', 'weigh_in_frequency', 'preferred_weigh_in_day']

class UserRegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['username', 'email', 'password']

    def create(self, validated_data):
        password = validated_data.pop('password')
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        # Signal автоматаар UserProfile үүсгэх тул энд бичих шаардлагагүй болно
        return user