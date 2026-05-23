from rest_framework import permissions


class IsInstructorOrReadOnly(permissions.BasePermission):
    
    def has_permission(self, request, view):
        if request.method in ['GET', 'HEAD', 'OPTION']:
            return True
        
        if not request.user.is_authenticated:
            return False
        
        return request.user.role in ['admin', 'instructor']