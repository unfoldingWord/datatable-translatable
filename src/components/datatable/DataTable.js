import React, {
  useState,
  useContext,
  useRef,
  useCallback,
  useMemo,
  useEffect,
} from "react";

import isEqual from "lodash.isequal";
import useDeepEffect from "use-deep-compare-effect";
import PropTypes from "prop-types";
import MUIDataTable from "mui-datatables";
import { MuiThemeProvider } from "@material-ui/core/styles";

import {
  MarkdownContext,
  MarkdownContextProvider,
} from "markdown-translatable";
import { Toolbar } from "../..";
import { getColumns, getData } from "./helpers";
import {
  DataTableContext,
  DataTableContextProvider,
} from "./DataTable.context";
import { getMuiTheme } from "./muiTheme";

const fixedHeaderOptions = { xAxis: false, yAxis: false };
const rowsPerPageOptions = [25, 50, 100];

export default function DataTableWrapper(props) {
  return (
    <MarkdownContextProvider>
      <DataTableContextProvider {...props}>
        <DataTable {...props} />
      </DataTableContextProvider>
    </MarkdownContextProvider>
  );
}

// eslint-disable-next-line react/display-name
const DatatableMemo = React.memo(
  function ({ columns, options, data, dataTableElement }) {
    return (
      <MUIDataTable
        ref={dataTableElement}
        columns={columns}
        options={options}
        data={data}
      />
    );
  },
  (prevProps, nextProps) => {
    const equal =
      isEqual(prevProps.data, nextProps.data) &&
      isEqual(prevProps.columns, nextProps.columns) &&
      isEqual(prevProps.options, nextProps.options);
    return equal;
  }
);

function DataTable({
  options = {},
  delimiters,
  onRenderToolbar,
  config,
  onSave,
  onEdit,
  onValidate,
  onContentIsDirty,
  sourceFile,
  generateRowId: _generateRowId,
  originalFontFamily,
  translationFontFamily,
  columnsMap,
  columns: extraColumns = [],
  ...props
}) {
  const { columnsFilter, columnsShowDefault, rowHeader } = config;
  const dataTableElement = useRef();
  const [preview, setPreview] = useState(false);
  const [columnsShow, setColumnsShow] = useState(columnsShowDefault);
  const [isAutoSaveChanged, setIsAutoSaveChanged] = useState(false);
  const [lastClickedDataIndex, setLastClickedDataIndex] = React.useState("");
  const [needToScroll, setNeedToScroll] = useState(false);
  const { state, actions } = useContext(DataTableContext);
  const dataTableState = useRef();
  const currentPageNumber = useRef(0);

  const { columnNames, data, columnsFilterOptions } = state;
  const { cellEdit: _cellEdit } = actions;

  const { state: markdownState, actions: markdownActions } =
    useContext(MarkdownContext) || {};

  const generateRowId = useCallback(_generateRowId, []);

  const cellEdit = useCallback(
    (parms) => {
      _cellEdit(parms);
      setIsAutoSaveChanged(true);
    },
    [_cellEdit, setIsAutoSaveChanged]
  );

  // We have to do it this way because https://github.com/gregnb/mui-datatables/issues/756#issuecomment-510191071
  const changePage = useCallback(
    function (page) {
      dataTableElement.current.changePage(page);
    },
    [dataTableElement]
  );

  useDeepEffect(() => {
    changePage(0);
  }, [changePage]);

  useEffect(() => {
    scrollToIndex(lastClickedDataIndex);
  },[columnsShow, preview])

  const scrollToIndex = useCallback(
    (index) => {
      if(index){
        setLastClickedDataIndex(index);
        const state = dataTableState.current;
        const displayedRows = state.displayData;
        const displayedRowIndex =
        displayedRows.findIndex((row) => row.dataIndex === index - 1) + 1;
        const newPage = Math.floor(
        displayedRowIndex / dataTableElement.current.state.rowsPerPage
      );
      setNeedToScroll(true);
      changePage(newPage);
      }     
    },
    [dataTableElement, changePage, dataTableState]
  );

  const scrollToLastClicked = () => {
    if (lastClickedDataIndex) {
      scrollToIndex(lastClickedDataIndex);
    }
  };

  // Push "isChanged," so app knows when SAVE button is enabled.
  // See also Translatable in markdown-translatable.
  useEffect(() => {
    if (onContentIsDirty) {
      onContentIsDirty(markdownState.isChanged);
    }
  }, [markdownState.isChanged, onContentIsDirty]);

  const togglePreview = useCallback(() => setPreview(!preview), [preview]);

  // _onSave is called by Toolbar; cellEdit is called by DataTable.
  // State (contents) are different at these two times. (cellEdit lags)
  const _onSave = useCallback(async () => {
    const savedFile = actions.targetFileSave();
    const saved = await onSave(savedFile);
    if(!markdownActions || !markdownActions.setIsChanged)
      return;

    if (saved === false) {
      markdownActions.setIsChanged(true);
    }
    else {
      markdownActions.setIsChanged(false);
    }
  }, [actions, onSave, markdownActions]);

  useDeepEffect(() => {
    if (onEdit && isAutoSaveChanged) {
      const savedFile = actions.targetFileSave();
      onEdit(savedFile);
      setIsAutoSaveChanged(false);
      // if (markdownActions && markdownActions.setIsAutoSaveChanged) {
      //   markdownActions.setIsAutoSaveChanged(false);
      // }
    }
  }, [isAutoSaveChanged, onEdit, markdownActions, actions]);

  const onColumnViewChange = useCallback(
    (changedColumn, action) => {
      let _columnsShow = [...columnsShow];

      if (action === "add") {
        _columnsShow.push(changedColumn);
      } else if (action === "remove") {
        _columnsShow = _columnsShow.filter((col) => col !== changedColumn);
      }
      setColumnsShow(_columnsShow);
      scrollToLastClicked()
    },
    [columnsShow]
  );

  if(columnsShow){
    localStorage.setItem('StoredColumn', columnsShow);
  }

  // Scroll to bottom when navigating to previous page
  const scrollToBottom = (action) => {
    if (dataTableElement && dataTableElement.current) {
      dataTableElement.current.tableRef.scrollIntoView({ block: 'end' });
    }
      currentPageNumber.current = action
  };

  // Scroll to Top when navigating to next page
  const scrollToTop = (action) => {
    if (dataTableElement && dataTableElement.current) {
      dataTableElement.current.tableRef.scrollIntoView({ block: 'start' });
    } 
    currentPageNumber.current = action
  };

  const _onValidate = useCallback(() => {
    // Note 1: the content on-screen, in-memory does NOT include
    // the headers. Since this component has no awareness of
    // specific resource requirements, the header must be added
    // as first row by the app itself.

    // Note 2: the content on-screen, in-memory contains both
    // source and target data. The target data must be teased
    // out. A new array of rows (target rows) will be created
    // and this is the data that will be passed to the validation
    // closure passed to this component.
    let targetRows = [];

    if (state && state.data) {
      let rows = state.data;

      for (let i = 0; i < rows.length; i++) {
        let row = rows[i];
        let targetRow = [];

        // now each cell has both source and target values, delimited by tab
        for (let j = 0; j < row.length; j++) {
          let values = row[j].split("\t");
          let targetValue = values[1];
          targetValue = targetValue
            .replaceAll("\\[", "[")
            .replaceAll("\\]", "]");
          targetRow.push(targetValue);
        }
        targetRows.push(targetRow);
      }
    }
    onValidate && onValidate(targetRows);
  }, [onValidate, state]);

  const customToolbar = useCallback(
    () => (
      <Toolbar
        preview={preview}
        onRenderItems={onRenderToolbar}
        onPreview={togglePreview}
        changed={markdownState.isChanged}
        onSave={_onSave}
        onValidate={onValidate ? _onValidate : undefined}
      />
    ),
    [
      _onSave,
      markdownState.isChanged,
      preview,
      togglePreview,
      _onValidate,
      onValidate,
      onRenderToolbar
    ]
  );

  const _options = {
    responsive: "scrollFullHeight",
    fixedHeaderOptions,
    resizableColumns: false,
    selectableRows: "none",
    rowHover: false,
    display: "excluded",
    rowsPerPage: 25,
    rowsPerPageOptions,
    onChangeRowsPerPage: scrollToTop,
    onColumnViewChange,
    onTableChange: function (action, state) {
      dataTableState.current = state;
    },
    onSearchClose: scrollToLastClicked,
    onFilterChange: (changed, filters) => {
      if (filters.filter((filter) => filter.length).length <= 0) {
        scrollToLastClicked();
      }
    },
    onRowClick: (rowData,{ dataIndex }) => {
      setLastClickedDataIndex(dataIndex);
    },
    onChangePage: (action) => {
      const prevPageNumber = currentPageNumber.current
        if (needToScroll) {
          setNeedToScroll(false);
          const element = document.getElementById(
            "MUIDataTableBodyRow-" + lastClickedDataIndex
          );
          if (element) {
            element.scrollIntoView();
            const parentRow = element.closest('tr');
            const allRows = parentRow.querySelectorAll('td > div > div > div');
            allRows.forEach((rowCell) => {
              rowCell.classList.add('show');
            });
            const firstEditableContent = parentRow.querySelector('[contenteditable="true"]');
            if ( firstEditableContent ) {
              setTimeout(() => {
                // Use setTimeout because https://stackoverflow.com/a/37162116/545378
                firstEditableContent.focus();
              });
            }
          }
        }else{
          if (action >= prevPageNumber){
          scrollToTop(action);
        }else{
          scrollToBottom(action)
        }
        }
    },
    download: false,
    print: false,
    customToolbar,
    ...options,
  };

  const _data = useMemo(
    () =>
      getData({
        data,
        columnNames,
        rowHeader,
      }),
    [columnNames, data, rowHeader]
  );

  const columns = useMemo(
    () =>
      getColumns({
        columnNames,
        columnsFilter,
        columnsFilterOptions,
        columnsShow,
        delimiters,
        rowHeader,
        generateRowId,
        cellEdit,
        preview,
        originalFontFamily,
        translationFontFamily,
        columnsMap,
        scrollToIndex,
      }),
    [
      cellEdit,
      columnNames,
      columnsFilter,
      columnsFilterOptions,
      columnsShow,
      delimiters,
      generateRowId,
      preview,
      rowHeader,
      originalFontFamily,
      translationFontFamily,
      columnsMap,
      scrollToIndex,
    ]
  );

  return (
    <MuiThemeProvider theme={getMuiTheme}>
      <div
        style={{
          "--datatable-original-font-family": originalFontFamily,
          "--datatable-translation-font-family": translationFontFamily,
        }}
      >
        <DatatableMemo
          dataTableElement={dataTableElement}
          columns={[...columns, ...extraColumns]}
          data={_data}
          options={_options}
          {...props}
        />
      </div>
    </MuiThemeProvider>
  );
}

DataTable.propTypes = {
  /** Original DataTable raw string or file contents */
  sourceFile: PropTypes.string.isRequired,
  /** Translated DataTable raw string or file contents */
  targetFile: PropTypes.string.isRequired,
  /** The callback to save the edited targetFile */
  onSave: PropTypes.func.isRequired,
  /** The callback to validate the edited targetFile */
  onValidate: PropTypes.func,
  onRenderToolbar: PropTypes.func,
  /** The delimiters for converting the file into rows/columns */
  delimiters: PropTypes.shape({
    /** Delimiters to convert a files into rows "\n" */
    row: PropTypes.string.isRequired,
    /** Delimiters to convert a row into cells "\t" */
    cell: PropTypes.string.isRequired,
  }).isRequired,
  /** Configuration options */
  config: PropTypes.shape({
    /** Combined Column Indices to correlate original and translated rows  */
    compositeKeyIndices: PropTypes.arrayOf(PropTypes.number).isRequired,
    /** Filterable columns */
    columnsFilter: PropTypes.arrayOf(PropTypes.string).isRequired,
    /** Columns shown */
    columnsShowDefault: PropTypes.arrayOf(PropTypes.string).isRequired,
    /** Function to render the row header.
     * `rowHeader(rowData) => React Component`
     */
    rowHeader: PropTypes.func,
    /** Object to override new row values 
     * @example
     * {
     *   "id": "1",
     *   "supportReference": "",
     *   "occurrence": "2"
     * }
    */
    newRowDefaultValues: PropTypes.objectOf(PropTypes.string),
  }).isRequired,
  /** Object to override columns settings */
  columnsMap: PropTypes.object,
  /** Array of extra columns */
  columns: PropTypes.array,
  /** Options to override or pass through to MUIDataTables.
   *  https://github.com/gregnb/mui-datatables
   */
  options: PropTypes.object,
};

DataTable.defaultProps = {
  delimiters: {
    row: "\n",
    cell: "\t",
  },
};

/* code graveyard

  const _onValidate = useCallback(() => {
    // NOTE! the content on-screen, in-memory does NOT include
    // the headers. So the initial value of tsvRows will be the headers.
    let tsvRows = "Book\tChapter\tVerse\tID\tSupportReference\tOrigQuote\tOccurrence\tGLQuote\tOccurrenceNote\n";
    if (state && state.data) {
      let rows = state.data;
      for (let i = 0; i < rows.length; i++) {
        let _row = rows[i];
        let _tsvRow = "";
        // now each cell has both source and target values, delimited by tab
        for (let j = 0; j < _row.length; j++) {
          let values = _row[j].split("\t");
          let targetValue = values[1];
          targetValue = targetValue.replaceAll('\\[', '[').replaceAll('\\]', ']');
          _tsvRow = _tsvRow + targetValue + "\t";
        }
        // add new row and a newline at end of row
        _tsvRow = _tsvRow.trim('\t');
        // check if row has content on target side
        if ( _tsvRow === '' ) continue;
        tsvRows = tsvRows + _tsvRow + "\n";
      }
    }
    onValidate && onValidate(tsvRows);
  }, [onValidate, state]);

*/
