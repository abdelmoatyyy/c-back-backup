const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Clinic Management System API',
            version: '1.0.0',
            description: 'API documentation for the Clinic Management System backend',
            contact: {
                name: 'API Support',
                email: 'support@clinic.com'
            }
        },
        servers: [
            {
                url: 'http://localhost:8000',
                description: 'Development server'
            }
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT'
                }
            },
            schemas: {
                User: {
                    type: 'object',
                    properties: {
                        userId: {
                            type: 'integer',
                            description: 'The auto-generated id of the user'
                        },
                        fullName: {
                            type: 'string',
                            description: 'Full name of the user'
                        },
                        email: {
                            type: 'string',
                            format: 'email',
                            description: 'Email address of the user'
                        },
                        role: {
                            type: 'string',
                            enum: ['admin', 'doctor', 'patient'],
                            description: 'Role of the user'
                        },
                        phoneNumber: {
                            type: 'string',
                            description: 'Phone number of the user'
                        },
                        createdAt: {
                            type: 'string',
                            format: 'date-time',
                            description: 'Timestamp when the user was created'
                        }
                    }
                },
                RegisterRequest: {
                    type: 'object',
                    required: ['fullName', 'email', 'password', 'role'],
                    properties: {
                        fullName: {
                            type: 'string',
                            example: 'John Doe'
                        },
                        email: {
                            type: 'string',
                            format: 'email',
                            example: 'john.doe@example.com'
                        },
                        password: {
                            type: 'string',
                            format: 'password',
                            example: 'securePassword123'
                        },
                        role: {
                            type: 'string',
                            enum: ['admin', 'doctor', 'patient'],
                            example: 'patient'
                        },
                        phoneNumber: {
                            type: 'string',
                            example: '1234567890'
                        }
                    }
                },
                LoginRequest: {
                    type: 'object',
                    required: ['email', 'password'],
                    properties: {
                        email: {
                            type: 'string',
                            format: 'email',
                            example: 'john.doe@example.com'
                        },
                        password: {
                            type: 'string',
                            format: 'password',
                            example: 'securePassword123'
                        }
                    }
                },
                RegisterResponse: {
                    type: 'object',
                    properties: {
                        success: {
                            type: 'boolean',
                            example: true
                        },
                        message: {
                            type: 'string',
                            example: 'User created!'
                        }
                    }
                },
                LoginResponse: {
                    type: 'object',
                    properties: {
                        success: {
                            type: 'boolean',
                            example: true
                        },
                        token: {
                            type: 'string',
                            example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
                        },
                        user: {
                            type: 'object',
                            properties: {
                                id: {
                                    type: 'integer',
                                    example: 1
                                },
                                fullName: {
                                    type: 'string',
                                    example: 'John Doe'
                                },
                                email: {
                                    type: 'string',
                                    example: 'john.doe@example.com'
                                },
                                role: {
                                    type: 'string',
                                    example: 'patient'
                                },
                                phoneNumber: {
                                    type: 'string',
                                    example: '1234567890'
                                }
                            }
                        }
                    }
                },
                Error: {
                    type: 'object',
                    properties: {
                        error: {
                            type: 'string',
                            example: 'Error message'
                        }
                    }
                }
            }
        }
    },
    apis: ['./routes/*.js', './controllers/*.js']
};

const specs = swaggerJsdoc(options);

module.exports = { specs, swaggerUi };