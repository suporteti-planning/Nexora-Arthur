package nexora.planning.nexora.dto;
import nexora.planning.nexora.model.Notebook;

import lombok.Data;
import nexora.planning.nexora.enums.NotebookStatus;

@Data
public class NotebookDTO {
    private Long id;
    private String name;
    private String brand;
    private String model;
    private String serialNumber;
    private String processor;
    private String ram;
    private String storage;
    private String observations;
    private NotebookStatus status;
    private Double price;

    public NotebookDTO(Notebook notebook) {
        this.id = notebook.getId();
        this.name = notebook.getName();
        this.brand = notebook.getBrand();
        this.model = notebook.getModel();
        this.serialNumber = notebook.getSerialNumber();
        this.processor = notebook.getProcessor();
        this.ram = notebook.getRam();
        this.storage = notebook.getStorage();
        this.status = notebook.getStatus();
        this.observations = notebook.getObservations();
        this.price = notebook.getPrice();
    }
}