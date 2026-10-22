package nexora.planning.nexora.util;

public final class MicrosoftDepartmentFormatter {

    private MicrosoftDepartmentFormatter() {
    }

    public static String format(String department, String leader) {
        String normalizedDepartment = normalize(department);
        String normalizedLeader = normalize(leader);

        if (normalizedDepartment.isEmpty() && normalizedLeader.isEmpty()) {
            return "";
        }

        if (normalizedDepartment.isEmpty()) {
            return normalizedLeader;
        }

        if (normalizedLeader.isEmpty()) {
            return normalizedDepartment;
        }

        String leaderSuffix = " | " + normalizedLeader;
        if (normalizedDepartment.length() >= leaderSuffix.length()
            && normalizedDepartment.regionMatches(true, normalizedDepartment.length() - leaderSuffix.length(), leaderSuffix, 0, leaderSuffix.length())) {
            return normalizedDepartment;
        }

        return normalizedDepartment + leaderSuffix;
    }

    private static String normalize(String value) {
        if (value == null) {
            return "";
        }
        return value.trim();
    }
}