```js
import { Typography } from "@material-ui/core";
import _sourceFile from "./mocks/en_tn_57-TIT";
import targetFile from "./mocks/ru_tn_57-TIT";

function Component() {
  const [sourceFile, setSourceFile] = React.useState(_sourceFile);
  const [savedFile, setSavedFile] = React.useState(targetFile);

  //Uncomment this to test a page change from a new source file
  // setTimeout(() => {
  //   setSourceFile(targetFile);
  // }, 5000)

  const delimiters = { row: "\n", cell: "\t" };

  const options = {
    page: 0,
    rowsPerPage: 10,
    rowsPerPageOptions: [10, 25, 50, 100],
  };

  const rowHeader = (rowData, actionsMenu) => {
    const book = rowData[0].split(delimiters.cell).find((value) => value);
    const chapter = rowData[1].split(delimiters.cell).find((value) => value);
    const verse = rowData[2].split(delimiters.cell).find((value) => value);
    const styles = {
      typography: {
        lineHeight: "1.0",
        fontWeight: "bold",
      },
    };
    const component = (
      <>
        <Typography variant="h6" style={styles.typography}>
          {`${book} ${chapter}:${verse}`}
        </Typography>
        {actionsMenu}
      </>
    );
    return component;
  };

  const config = {
    compositeKeyIndices: [0, 1, 2, 3],
    columnsFilter: ["Chapter", "SupportReference"],
    columnsShowDefault: [
      "SupportReference",
      "OrigQuote",
      "Occurrence",
      "OccurrenceNote",
    ],
    rowHeader,
  };

  const onSave = (_savedFile) => {
    setSavedFile(_savedFile);
    alert(_savedFile);
  };

  const onValidate = () => {
    alert("Validate!")
  }
  const generateRowId = (rowData) => {
    const [chapter] = rowData[2].split(delimiters.cell);
    const [verse] = rowData[3].split(delimiters.cell);
    const [uid] = rowData[4].split(delimiters.cell);
    return `header-${chapter}-${verse}-${uid}`;
  };

  return (
    <DataTableWrapper
      sourceFile={sourceFile}
      targetFile={savedFile}
      onSave={onSave}
      onValidate={onValidate}
      delimiters={delimiters}
      config={config}
      options={options}
      generateRowId={generateRowId}
    />
  );
}
<Component />;
```

### Demo of 7 column TSV files

This demo shows use of the data table using the 7 column style of TSV.
The columns used in new TSV format are:
Reference, ID, Tags, SupportReference, Quote, Occurrence, and Annotation.

Thus to obtain Book, Chapter, Verse (BCV):
- Book: comes from the name of the file; is not present in the file itself
- Chapter and Verse: come from the "Reference" (first) column and is in "1:1" format.

```js
import { Typography } from "@material-ui/core";
import _sourceFile from "./mocks/TIT_tq_source";
import targetFile from "./mocks/TIT_tq_target";

function Component() {
  const [sourceFile, setSourceFile] = React.useState(_sourceFile);
  const [savedFile, setSavedFile] = React.useState(targetFile);

  //Uncomment this to test a page change from a new source file
  // setTimeout(() => {
  //   setSourceFile(targetFile);
  // }, 5000)

  const delimiters = { row: "\n", cell: "\t" };

  const options = {
    page: 0,
    rowsPerPage: 10,
    rowsPerPageOptions: [10, 25, 50, 100],
  };

  const rowHeader = (rowData, actionsMenu) => {
    const reference = rowData[0].split(delimiters.cell)[0];
    const bookId = "ABC";
    const styles = {
      typography: {
        lineHeight: "1.0",
        fontWeight: "bold",
      },
    };
    const component = (
      <>
        <Typography variant="h6" style={styles.typography}>
          {`${bookId} ${reference}`}
        </Typography>
        {actionsMenu}
      </>
    );
    return component;
  };
  // Column headers for 7 column format:
  // Reference, ID, Tags, SupportReference, Quote, Occurrence, and Annotation.
  const config = {
    compositeKeyIndices: [0, 1],
    columnsFilter: ["Reference", "ID", "Tags"],
    columnsShowDefault: [
      "SupportReference",
      "Quote",
      "Occurrence",
      "Annotation",
    ],
    rowHeader,
  };

  const onSave = (_savedFile) => {
    setSavedFile(_savedFile);
    alert(_savedFile);
  };

  const onValidate = () => {
    alert("Validate!")
  }
  const generateRowId = (rowData) => {
    const reference = rowData[1].split(delimiters.cell)[0];
    const [chapter, verse] = reference.split(":");
    const [uid] = rowData[2].split(delimiters.cell)[1];
    let rowId = `header-${chapter}-${verse}-${uid}`;
    return rowId;
  };

  return (
    <DataTableWrapper
      sourceFile={sourceFile}
      targetFile={savedFile}
      onSave={onSave}
      onValidate={onValidate}
      delimiters={delimiters}
      config={config}
      options={options}
      generateRowId={generateRowId}
    />
  );
}
<Component />;
```
