from rest_framework import permissions

class IsInstructorOrReadOnly(permissions.BasePermission):
    
    def has_permission(self, request, view):
        if request.method in ['GET', 'HEAD', 'OPTION']:
            return True
        
        return request.user.role == ['instructor', 'admin']