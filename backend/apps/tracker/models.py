from django.db import models
from django.contrib.auth.models import User

class DailyLog(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='daily_logs')
    date = models.DateField()
    weight_kg = models.FloatField(null=True, blank=True)
    water_ml = models.IntegerField(default=0)
    burned_calories = models.IntegerField(default=0)

    class Meta:
        unique_together = ('user', 'date')
        ordering = ['-date']

    def __str__(self):
        return f"{self.user.username} - {self.date}"

class BodyMeasurement(models.Model):
    """ Биеийн хэмжээсүүд (Бэлхүүс, цээж, гар, гуя г.м) """
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='measurements')
    date = models.DateField()
    chest_cm = models.FloatField(null=True, blank=True, verbose_name="Цээж")
    waist_cm = models.FloatField(null=True, blank=True, verbose_name="Бэлхүүс")
    hip_cm = models.FloatField(null=True, blank=True, verbose_name="Ташаа")
    arm_cm = models.FloatField(null=True, blank=True, verbose_name="Гар")
    thigh_cm = models.FloatField(null=True, blank=True, verbose_name="Гуя")

    class Meta:
        ordering = ['-date']

class FoodEntry(models.Model):
    MEAL_TYPES = (
        ('breakfast', 'Өглөө'),
        ('lunch', 'Өдөр'),
        ('dinner', 'Орой'),
        ('snack', 'Зууш'),
    )
    daily_log = models.ForeignKey(DailyLog, on_delete=models.CASCADE, related_name='foods')
    name = models.CharField(max_length=150)
    calories = models.IntegerField()
    meal_type = models.CharField(max_length=20, choices=MEAL_TYPES, default='lunch')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} ({self.calories} ккал)"