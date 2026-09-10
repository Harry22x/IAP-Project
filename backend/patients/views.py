from rest_framework import viewsets
from rest_framework.response import Response
from django.db.models import Q
from .models import Patient, Donor, Recipient
from .serializers import PatientSerializer, DonorSerializer, RecipientSerializer, UnifiedPatientSerializer
from hospitals.serializers import HospitalSerializer
from medical_records.models import Prescription
from medical_records.serializers import PrescriptionSerializer
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action

class PatientViewSet(viewsets.ModelViewSet):
    serializer_class = PatientSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        if self.request.user.hospital:
            queryset = Patient.objects.filter(hospital=self.request.user.hospital)
        else:
            queryset = Patient.objects.all()

        match_status = self.request.query_params.get('match_status')
        if match_status:
            queryset = queryset.filter(
                Q(donor_profile__matches__match_status=match_status) |
                Q(recipient_profile__matches__match_status=match_status)
            ).distinct()

        return queryset

    def perform_create(self, serializer):
        serializer.save(hospital=self.request.user.hospital)

    @action(detail=True, methods=['get'], url_path='location')
    def location(self, request, pk=None):
        patient = self.get_object()
        return Response(HospitalSerializer(patient.hospital).data)

    @action(detail=True, methods=['get'], url_path='medicine')
    def medicine(self, request, pk=None):
        patient = self.get_object()
        prescriptions = Prescription.objects.filter(patient=patient)
        return Response({
            'patient_id': patient.patient_id,
            'name': patient.name,
            'prescribed_medicine': PrescriptionSerializer(
                prescriptions,
                many=True
            ).data,
        })

class DonorViewSet(viewsets.ModelViewSet):
    serializer_class = DonorSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        if self.request.user.hospital:
            return Donor.objects.filter(donor_id__hospital=self.request.user.hospital)
        return Donor.objects.all()

class RecipientViewSet(viewsets.ModelViewSet):
    serializer_class = RecipientSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        if self.request.user.hospital:
            return Recipient.objects.filter(recipient_id__hospital=self.request.user.hospital)
        return Recipient.objects.all()

class UnifiedPatientViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]

    def list(self, request):
        if request.user.hospital:
            patients = Patient.objects.filter(hospital=request.user.hospital).order_by('-created_at')
        else:
            patients = Patient.objects.all().order_by('-created_at')
            
        data = []
        for p in patients:
            is_donor = hasattr(p, 'donor_profile')
            data.append({
                'id': p.patient_id,
                'name': p.name,
                'patient_type': 'Donor' if is_donor else 'Recipient',
                'organ': p.organ_type,
                'blood_type': p.blood_type,
                'hospital_name': p.hospital.name if p.hospital else None,
                'medical_state': p.medical_history.replace('State: ', '') if p.medical_history.startswith('State: ') else 'Unknown',
            })
        return Response(data)

    def create(self, request):
        serializer = UnifiedPatientSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response({'message': 'Patient created successfully'})
        return Response(serializer.errors, status=400)

