import { Toolbar } from '../..';
import { getMuiTheme } from './muiTheme';
import { DataTableContext, DataTableContextProvider } from './DataTable.context';
import { getColumns, getData } from './helpers';

import React, {
  useState, useContext, useRef, useCallback, useMemo
} from 'react';
import isEqual from 'lodash.isequal';
import useDeepEffect from 'use-deep-compare-effect';
import PropTypes from 'prop-types';
import MUIDataTable from 'mui-datatables';
import { MuiThemeProvider } from '@material-ui/core/styles';

import { MarkdownContext, MarkdownContextProvider } from 'markdown-translatable';

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
const DatatableMemo = React.memo(function ({
  columns, options, data, dataTableElement,
}) {
  return (<MUIDataTable ref={dataTableElement} columns={columns} options={options} data={data} />);
}, (prevProps, nextProps) => {
  const equal = isEqual(prevProps.data, nextProps.data) &&
    isEqual(prevProps.columns, nextProps.columns) &&
    isEqual(prevProps.options, nextProps.options);
  return equal;
});

function DataTable({
  options = {},
  delimiters,
  config,
  onSave,
  onEdit,
  onValidate,
  sourceFile,
  generateRowId: _generateRowId,
  ...props
}) {
  const {
    columnsFilter,
    columnsShowDefault,
    rowHeader,
  } = config;
  const dataTableElement = useRef();
  const [rowsPerPage, setRowsPerPage] = useState(options.rowsPerPage || 25);
  const [preview, setPreview] = useState(true);
  const [columnsShow, setColumnsShow] = useState(columnsShowDefault);
  const [isAutoSaveChanged, setIsAutoSaveChanged] = useState(false);

  const { state: {isChanged}, actions: markdownActions } = useContext(MarkdownContext);

  const { state, actions } = useContext(DataTableContext);
  const {
    columnNames, data, columnsFilterOptions,
  } = state;
  const { cellEdit: _cellEdit } = actions;

  const generateRowId = useCallback(_generateRowId, []);

  const cellEdit = useCallback(parms => {
    _cellEdit(parms);
    setIsAutoSaveChanged(true);
  }, [_cellEdit, setIsAutoSaveChanged]);

  const changePage = useCallback(function (page) {
    dataTableElement.current.changePage(page);
  }, [dataTableElement]);

  useDeepEffect(() => {
    changePage(0);
  }, [changePage]);

  const togglePreview = useCallback(() => setPreview(!preview), [preview]);

  // _onSave is called by Toolbar; cellEdit is called by DataTable.
  // State (contents) are different at these two times. (cellEdit lags)
  const _onSave = useCallback(() => {
    const savedFile = actions.targetFileSave();
    onSave(savedFile);

    if (markdownActions && markdownActions.setIsChanged) {
      markdownActions.setIsChanged(false);
    }
  }, [actions, onSave, markdownActions]);

  useDeepEffect(() => {
    console.log("useDeepEffect for isAutoSaveChanged");
    if (onEdit && isAutoSaveChanged)
    {
      const savedFile = actions.targetFileSave();
      onEdit(savedFile);
      
      setIsAutoSaveChanged(false);
      // if (markdownActions && markdownActions.setIsAutoSaveChanged) {
      //   markdownActions.setIsAutoSaveChanged(false);
      // }
    }
  }, [isAutoSaveChanged, onEdit, markdownActions, actions]);
  
  const onColumnViewChange = useCallback((changedColumn, action) => {
    let _columnsShow = [...columnsShow];

    if (action === 'add') {
      _columnsShow.push(changedColumn);
    } else if (action === 'remove') {
      _columnsShow = _columnsShow.filter(col => col !== changedColumn);
    }
    setColumnsShow(_columnsShow);
  }, [columnsShow]);

  const scrollToTop = useCallback(() => {
    window.scrollTo(0, 0);
    // if (dataTableElement && dataTableElement.current) {
    //   window.scrollTo(0, dataTableElement.current.tableRef.offsetParent.offsetTop);
    // }
  }, []);

  const onChangeRowsPerPage = useCallback(() => (rows) => {
    setRowsPerPage(rows);
    scrollToTop();
  }, [scrollToTop]);

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

  const customToolbar = useCallback(() =>
    <Toolbar preview={preview} onPreview={togglePreview} changed={isChanged} onSave={_onSave} onValidate={onValidate ? _onValidate : undefined} />,
    [_onSave, isChanged, preview, togglePreview, _onValidate, onValidate]
  );

  const _options = useMemo(() => ({
    responsive: 'scrollFullHeight',
    fixedHeaderOptions,
    resizableColumns: false,
    selectableRows: 'none',
    rowHover: false,
    rowsPerPage,
    rowsPerPageOptions,
    onChangeRowsPerPage,
    onColumnViewChange,
    onChangePage: scrollToTop,
    download: false,
    print: false,
    customToolbar,
    ...options,
  }), [customToolbar, onChangeRowsPerPage, onColumnViewChange, options, rowsPerPage, scrollToTop]);

  const _data = useMemo(() => getData({
    data, columnNames, rowHeader,
  }), [columnNames, data, rowHeader]);

  const columns = useMemo(() => getColumns({
    columnNames, columnsFilter, columnsFilterOptions,
    columnsShow, delimiters, rowHeader,
    generateRowId, cellEdit, preview,
  }), [cellEdit, columnNames, columnsFilter, columnsFilterOptions, columnsShow, delimiters, generateRowId, preview, rowHeader]);

  return (
    <MuiThemeProvider theme={getMuiTheme}>
      <DatatableMemo dataTableElement={dataTableElement} columns={columns} data={_data} options={_options} {...props} />
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
  }).isRequired,
  /** Options to override or pass through to MUIDataTables.
   *  https://github.com/gregnb/mui-datatables
   */
  options: PropTypes.object,
};

DataTable.defaultProps = {
  delimiters: {
    row: '\n',
    cell: '\t',
  },
};