from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver

class UserProfile(models.Model):
    WEEKDAYS = [
        ('1', 'Даваа'),
        ('2', 'Мягмар'),
        ('3', 'Лхагва'),
        ('4', 'Пүрэв'),
        ('5', 'Баасан'),
        ('6', 'Бямба'),
        ('7', 'Ням'),
    ]
    
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    height_cm = models.FloatField(default=170.0)
    start_weight = models.FloatField(default=80.0)
    target_weight = models.FloatField(default=70.0)
    daily_calorie_goal = models.IntegerField(default=1800)
    daily_water_goal_ml = models.IntegerField(default=2000)
    
    weigh_in_frequency = models.CharField(max_length=10, choices=[('daily', 'Өдөр бүр'), ('weekly', '7 хоногт 1 удаа')], default='weekly')
    preferred_weigh_in_day = models.CharField(max_length=1, choices=WEEKDAYS, default='1')

    def __str__(self):
        return f"{self.user.username} - Профайл"

# Хэрэглэгч шинээр үүсэхэд автоматаар UserProfile хамт үүсэх Signal
@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        UserProfile.objects.create(user=instance)