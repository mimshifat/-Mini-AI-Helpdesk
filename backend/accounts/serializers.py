from django.contrib.auth import authenticate
from rest_framework import serializers
from .models import User


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True, style={'input_type': 'password'})

    def validate(self, data):
        user = authenticate(
            request=self.context.get('request'),
            username=data['username'],
            password=data['password'],
        )
        if user is None:
            raise serializers.ValidationError(
                {'non_field_errors': ['Invalid username or password.']}
            )
        if not user.is_active:
            raise serializers.ValidationError(
                {'non_field_errors': ['This account has been disabled.']}
            )
        data['user'] = user
        return data


class UserSerializer(serializers.ModelSerializer):
    """Read-only serializer — never used for writes."""

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'role']
        read_only_fields = fields


class RegisterSerializer(serializers.ModelSerializer):
    """Write serializer for new user registration."""

    email = serializers.EmailField(required=True)
    password = serializers.CharField(
        write_only=True,
        min_length=6,
        style={'input_type': 'password'},
        help_text='Password must be at least 6 characters long.',
    )

    class Meta:
        model = User
        fields = ['username', 'email', 'password']

    def validate_username(self, value):
        value = value.strip()
        if len(value) < 3:
            raise serializers.ValidationError('Username must be at least 3 characters long.')
        if User.objects.filter(username__iexact=value).exists():
            raise serializers.ValidationError('A user with that username already exists.')
        return value

    def validate_email(self, value):
        value = value.strip().lower()
        if not value:
            raise serializers.ValidationError('Email address is required.')
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError('A user with that email already exists.')
        return value

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            role=User.Role.USER,  # Default role for all self-registered accounts
        )
        return user
