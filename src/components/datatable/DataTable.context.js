import React, {
  useState, useReducer, useEffect, useMemo,
} from 'react';
import isEqual from 'lodash.isequal';
import useDeepEffect from 'use-deep-compare-effect';
import deepFreeze from 'deep-freeze';

import {
  rowMoveAbove, rowMoveBelow, rowAddBelow, rowDelete, cellEdit,
  parseDataTable, correlateData, rowGenerate, stringify, getColumnsFilterOptions,
} from '../../core/datatable';

export const DataTableContext = React.createContext();


export function DataTableContextProvider({
  children,
  sourceFile,
  targetFile,
  delimiters,
  parser,
  config: {
    compositeKeyIndices,
    columnsFilter,
    newRowDefaultValues,
  },
}) {
  const [data, setData] = useState({});
  
  const rowsReducer = (rows, action) => {
    let _rows;
    const { type, value } = action;
    const {
      rowIndex, rowData, columnIndex,
    } = value;
  
    switch (type) {
      case 'SET_ROWS':
        return deepFreeze(value.rows);
      case 'ROW_MOVE_ABOVE':
        _rows = rowMoveAbove({ rows, rowIndex });
        return deepFreeze(_rows);
      case 'ROW_MOVE_BELOW':
        _rows = rowMoveBelow({ rows, rowIndex });
        return deepFreeze(_rows);
      case 'ROW_ADD_BELOW':
        _rows = rowAddBelow({
          rows, rowIndex, rowData,
        });
        return deepFreeze(_rows);
      case 'ROW_DELETE':
        _rows = rowDelete({ rows, rowIndex });
        return deepFreeze(_rows);
      case 'CELL_EDIT':
        _rows = cellEdit({
          rows, rowIndex, columnIndex, value: value.value, data,
        });
        return deepFreeze(_rows);
      default:
        throw new Error(`Unsupported action type: ${action.type}`);
    };
  };

  const [sourceRows, setSourceRows] = useState({});
  const [targetRows, targetRowsDispatch] = useReducer(rowsReducer, {});
  const setTargetRows = (rows) => targetRowsDispatch({ type: 'SET_ROWS', value: { rows } });
  const [changed, setChanged] = useState(false);
  const [columnNames, setColumnNames] = useState({});
  const [columnsFilterOptions, setColumnsFilterOptions] = useState([]);


  // populate columnsFilterOptions when ready
  useEffect(() => {
    if (columnsFilter && columnNames && Object.keys(data).length) {
      const columnIndices = columnsFilter.map(columnName => columnNames.indexOf(columnName));
      const _columnsFilterOptions = getColumnsFilterOptions({
        columnIndices, data, delimiters,
      });

      if (!isEqual(_columnsFilterOptions, columnsFilterOptions)) {
        setColumnsFilterOptions(_columnsFilterOptions);
      }
    }
  }, [columnsFilter, columnNames, data, delimiters, columnsFilterOptions]);
  // parse sourceFile when updated
  useEffect(() => {
    if (parser && parser.tsvStringToTable) {
      console.log("DataTable.context() using tsv parser for source")
      const { data: rows } = parser.tsvStringToTable(sourceFile);
      setSourceRows(rows);
    } else {
      if (delimiters) {
        const { rows } = parseDataTable({ table: sourceFile, delimiters });
        setSourceRows(rows);
      }
    }
  }, [sourceFile, delimiters, parser]);
  // parse targetFile when updated
  useEffect(() => {
    if (parser && parser.tsvStringToTable) {
      console.log("DataTable.context() using tsv parser for target")
      const { header: columnNames, data: rows } = parser.tsvStringToTable(targetFile);
      setColumnNames(columnNames);
      setTargetRows(rows);
      setChanged(false);
    } else if (delimiters) {
        const { columnNames, rows } = parseDataTable({ table: targetFile, delimiters });
        setColumnNames(columnNames);
        setTargetRows(rows);
        setChanged(false);
    }
  }, [targetFile, delimiters, parser]);
  // correlate data by compositeKeyIndices when sourceRows or targetRows updated
  useDeepEffect(() => {
    if (Object.keys(sourceRows).length && Object.keys(targetRows).length) {
      const _data = correlateData({
        sourceRows, targetRows, compositeKeyIndices, delimiters,
      });
      setData(_data);
    }
  }, [sourceRows, targetRows, compositeKeyIndices, delimiters]);

  const actions = useMemo(() => ({
    rowMoveAbove: ({ rowIndex }) => {
      targetRowsDispatch({ type: 'ROW_MOVE_ABOVE', value: { rowIndex } });
      setChanged(true);
    },
    rowMoveBelow: ({ rowIndex }) => {
      targetRowsDispatch({ type: 'ROW_MOVE_BELOW', value: { rowIndex } });
      setChanged(true);
    },
    rowAddBelow: ({ rowIndex, rowData }) => {
      targetRowsDispatch({ type: 'ROW_ADD_BELOW', value: { rowIndex, rowData } });
      setChanged(true);
    },
    rowDelete: ({ rowIndex }) => {
      targetRowsDispatch({ type: 'ROW_DELETE', value: { rowIndex } });
      console.log("row deleted");
      setChanged(true);
    },
    cellEdit: ({
      rowIndex, columnIndex, value, 
    }) => {
      targetRowsDispatch({
        type: 'CELL_EDIT', value: {
          rowIndex, columnIndex, value, 
        },
      });
      setChanged(true);
    },
    rowGenerate: ({ rowIndex }) => rowGenerate({
      rows: targetRows, columnNames, rowIndex,
    }),
    targetFileSave: () => {
      if (parser && parser.tableToTsvString) {
        // combine header rows and data rows
        let table = [];
        table.push(columnNames);
        for (let i=0; i<targetRows.length; i++) {
          table.push(targetRows[i]);
        }
        const {data, errors} = parser.tableToTsvString(table);
        if ( errors.length !== 0 ) {
          throw(JSON.stringify(errors,null,4));
        }
        return data;
      } else {
        return stringify({
        columnNames, rows: targetRows, delimiters,
    })}},
    setChanged,
  }), [columnNames, delimiters, targetRows, parser]);

  const value = useMemo(() => deepFreeze({
    state: {
      columnNames,
      data,
      changed,
      columnsFilterOptions,
      newRowDefaultValues,
    },
    actions,
  }), [actions, changed, columnNames, columnsFilterOptions, data]);

  let component = <></>;

  if (columnNames && Object.keys(data).length) {
    component = (
      <DataTableContext.Provider value={value}>
        {children}
      </DataTableContext.Provider>
    );
  }
  return component;
};
