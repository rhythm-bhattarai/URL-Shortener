from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .serializers import URLCreateSerializer
from .services import generate_short_url


# Create your views here.


class ShortenURLView(APIView):
    def post(self, request):
        serializer = URLCreateSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        try:
            url_obj, created = generate_short_url(
                original_url=serializer.validated_data['original_url']
            )
        except Exception as e:
            return Response(
                {"error": str(e)}, 
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )

        output_serializer = URLCreateSerializer(url_obj)
        
        if created:
            return Response(output_serializer.data, status=status.HTTP_201_CREATED)
        
        return Response(output_serializer.data, status=status.HTTP_200_OK)