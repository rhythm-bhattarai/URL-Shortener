import time
from django.http import JsonResponse
from django.core.cache import cache

class RateLimitMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

        self.RATE_LIMIT = 5 

    def __call__(self, request):

        if request.path.startswith('/api/shorten/') and request.method == 'POST':
        
            ip_address = request.META.get('HTTP_X_FORWARDED_FOR')

            if ip_address:
                ip_address = ip_address.split(',')[0].strip()
                
            else:
                ip_address = request.META.get('REMOTE_ADDR')

            current_minute = time.strftime('%Y%m%d%H%M', time.gmtime())
            redis_key = f"rl:{ip_address}:{current_minute}"

            cache.add(redis_key, 0, timeout=60) 
            current_count = cache.incr(redis_key)

            if current_count > self.RATE_LIMIT:
                seconds_remaining = 60 - int(time.time() % 60)
                
                return JsonResponse(
                    {
                        "error": "Rate limit exceeded",
                        "retry_after_seconds": seconds_remaining
                    },
                    status=429
                )

        response = self.get_response(request)
        return response