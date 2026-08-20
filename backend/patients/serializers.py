from rest_framework import serializers
from django.db import transaction
from .models import Patient, Donor, Recipient
from medical_records.models import MedicalRecord

class PatientSerializer(serializers.ModelSerializer):
    class Meta:
        model = Patient
        fields = '__all__'
        read_only_fields = ['hospital'] 

class DonorSerializer(serializers.ModelSerializer):
    patient_id = serializers.PrimaryKeyRelatedField(
        queryset=Patient.objects.all(), source='donor_id'
    )
    
    class Meta:
        model = Donor
        fields = ['patient_id', 'consent_status', 'availability']

class RecipientSerializer(serializers.ModelSerializer):
    patient_id = serializers.PrimaryKeyRelatedField(
        queryset=Patient.objects.all(), source='recipient_id'
    )
    
    class Meta:
        model = Recipient
        fields = ['patient_id', 'waiting_list_status']

class UnifiedPatientSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=255)
    patient_type = serializers.ChoiceField(choices=['Donor', 'Recipient'])
    organ = serializers.CharField(max_length=100)
    medical_state = serializers.ChoiceField(choices=['Living', 'Deceased'], required=False)
    lab_date = serializers.DateField()
    blood_type = serializers.CharField(max_length=10)
    
    def create(self, validated_data):
        hospital = self.context['request'].user.hospital
        
        with transaction.atomic():
            patient = Patient.objects.create(
                hospital=hospital,
                name=validated_data['name'],
                blood_type=validated_data['blood_type'],
                organ_type=validated_data['organ'],
                medical_history=f"State: {validated_data.get('medical_state', 'Unknown')}",
                urgency_level=1 if validated_data['patient_type'] == 'Donor' else 3 # Higher priority for demo recipient
            )
            
            if validated_data['patient_type'] == 'Donor':
                Donor.objects.create(donor_id=patient, availability=True, consent_status=True)
            else:
                Recipient.objects.create(recipient_id=patient, waiting_list_status='ACTIVE')
                
            MedicalRecord.objects.create(
                patient=patient,
                record_type='GENERAL',
                test_date=validated_data['lab_date'],
                verified_status=True,
                lab_results={"blood_type": validated_data['blood_type']}
            )
            
            MedicalRecord.objects.create(
                patient=patient,
                record_type='HLA_TYPING',
                test_date=validated_data['lab_date'],
                verified_status=True,
                lab_results={"hla_a": "Positive"}
            )

            MedicalRecord.objects.create(
                patient=patient,
                record_type='CROSSMATCH',
                test_date=validated_data['lab_date'],
                verified_status=True,
                lab_results={"crossmatch": "Negative"}
            )
            
            return validated_data

