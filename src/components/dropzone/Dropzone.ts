import { splitFileName } from '../../utils/utils';
import type { HierarchyJSON } from '../TimberTypes';

export class Dropzone {
  component: HTMLElement;
  inputElem: HTMLInputElement;
  dropzoneUpdated: () => void;
  initDataFromDropzone: (dropzoneData: HierarchyJSON) => void;

  isDragging = false;
  dragElement: HTMLElement | null = null;
  errorMessage = ' ';

  constructor(
    component: HTMLElement,
    inputElem: HTMLInputElement,
    dropzoneUpdated: () => void,
    initDataFromDropzone: (dropzoneData: HierarchyJSON) => void
  ) {
    this.component = component;
    this.inputElem = inputElem;
    this.dropzoneUpdated = dropzoneUpdated;
    this.initDataFromDropzone = initDataFromDropzone;
  }

  /**
   * Event handler for clicking the dropzone
   */
  clickHandler = () => {
    this.inputElem?.click();
  };

  /**
   * Event handler for drag enter
   * @param e Event
   */
  dragEnterHandler = (e: DragEvent) => {
    e.preventDefault();

    this.isDragging = true;

    // Store the drag element, so we don't leave the drag state when user hovers
    // over the messages
    this.dragElement = e.target as HTMLElement;
    this.dropzoneUpdated();
  };

  /**
   * Event handler for drag over
   * @param e Event
   */
  dragOverHandler = (e: DragEvent) => {
    e.preventDefault();
  };

  /**
   * Event handler for drag leave
   * @param e Event
   */
  dragLeaveHandler = (e: DragEvent) => {
    e.preventDefault();

    if (this.dragElement === e.target) {
      this.isDragging = false;
      this.dropzoneUpdated();
    }
  };

  /**
   * Event handler for drag drop
   * @param e Event
   */
  dropHandler = async (e: DragEvent) => {
    e.preventDefault();
    let data: HierarchyJSON | null = null;
    let file = null;

    if (e.dataTransfer?.items) {
      // Use DataTransferItemList interface to access the file(s)
      if (e.dataTransfer.items[0].kind === 'file') {
        file = e.dataTransfer.items[0].getAsFile();
        data = await this.validateFile(file!);
      }
    } else {
      // Use DataTransfer interface to access the file(s)
      file = e.dataTransfer!.files[0];
      data = await this.validateFile(file);
    }

    this.isDragging = false;
    this.dropzoneUpdated();

    if (!data) return;

    // Pass the data to parent
    this.initDataFromDropzone(data);
  };

  /**
   * Event handler for file selection completed
   * @param e Event
   */
  inputChanged = async (e: InputEvent) => {
    e.preventDefault();
    let data: HierarchyJSON | null = null;

    const files = (e.target as HTMLInputElement).files;

    if (files !== null) {
      const file = files[0];
      data = await this.validateFile(file);
      console.log(data);
    }

    if (!data) return;

    // Pass the data to parent
    this.initDataFromDropzone(data);
  };

  inputClicked = () => {
    // pass
  };

  /**
   * Read the file dropped by the user
   * @param file Dropped file from the user
   * @returns Parsed HierarchJSON object or null if there is an error
   */
  readJSON = (file: File): Promise<HierarchyJSON | null> => {
    return new Promise((resolve, reject) => {
      const fr = new FileReader();
      fr.onload = () => {
        if (fr.result) {
          resolve(JSON.parse(fr.result as string) as HierarchyJSON);
        } else {
          resolve(null);
        }
      };
      fr.onerror = reject;
      fr.readAsText(file);
    });
  };

  /**
   * Simple validation for the dropped file
   * @param file Dropped file from the user
   * @returns Parsed HierarchJSON object or null if there is an error
   */
  validateFile = async (file: File) => {
    if (file.type !== 'application/json') {
      this.errorMessage = 'It is not a JSON file';
      this.dropzoneUpdated();
      return null;
    }

    // Try to read the file
    const data = await this.readJSON(file);
    return data;
  };
}
