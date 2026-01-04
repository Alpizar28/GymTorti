package com.mastergym.backend.common.gym;

public final class GymContext {
    private static final ThreadLocal<Long> GYM_ID = new ThreadLocal<>();

    private GymContext() {}

    public static void setGymId(Long gymId) {
        GYM_ID.set(gymId);
    }

    public static Long getGymId() {
        return GYM_ID.get();
    }

    public static Long requireGymId() {
        Long gymId = GYM_ID.get();
        if (gymId == null) {
            throw new IllegalStateException("GymContext no inicializado (falta gymId en el token)");
        }
        return gymId;
    }

    public static void clear() {
        GYM_ID.remove();
    }
}
