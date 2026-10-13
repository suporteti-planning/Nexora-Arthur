package nexora.planning.nexora.dto;

import nexora.planning.nexora.enums.costCenter;
import nexora.planning.nexora.enums.NotebookStatus;

import lombok.Data;


@Data
public class NotebookResponseDTO {
    private Long id;
    private String name;
    private String brand;
    private String model;
    private String serialNumber;
    private String processor;
    private String ram;
    private String storage;
    private String operatingSystem;
    private String observations;
    private EmployeeBasicDTO employee;
    private costCenter costCenter;
    private NotebookStatus status;
    private Double price;
}