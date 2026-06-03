from rest_framework import permissions


class IsInstructorOrReadOnly(permissions.BasePermission):
    
    def has_permission(self, request, view):
        if request.method in ['GET', 'HEAD', 'OPTIONS']: # Safe Methods that do not modify data, so allow anyone to access eg: /courses/ for GET request
            return True
        
        if not request.user.is_authenticated: # Checks if the user is Logged in
            return False
        
        return request.user.role in ['admin', 'instructor'] # POST, PUT, DELETE only allowed for admin and instructor 