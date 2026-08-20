from rest_framework import serializers
from django.contrib.auth import get_user_model
from hospitals.models import Hospital

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    hospital_name = serializers.CharField(source='hospital.name', read_only=True)
    
    class Meta:
        model = User
        fields = ['user_id', 'email', 'name', 'role', 'hospital', 'hospital_name', 'is_active']
        read_only_fields = ['user_id']

class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    hospital_name = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = User
        fields = ['email', 'password', 'name', 'role', 'hospital_name']

    def create(self, validated_data):
        hospital_name = validated_data.pop('hospital_name', None)
        password = validated_data.pop('password')
        
        hospital = None
        if hospital_name:
            hospital, created = Hospital.objects.get_or_create(
                name=hospital_name,
                defaults={'location': 'Main'} # Default location
            )
            
        user = User.objects.create_user(
            **validated_data,
            password=password,
            hospital=hospital
        )
        return user
