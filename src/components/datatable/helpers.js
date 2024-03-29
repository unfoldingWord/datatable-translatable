import React from 'react';
import { filterLogic, filterDisplay } from '../column-filter/helpers';
import { Cell , HeaderCell } from '../cell';


export function getColumns({
  columnNames, columnsFilter, columnsFilterOptions, columnsMap = {},
  columnsShow, delimiters, rowHeader,
  generateRowId, cellEdit, preview, scrollToIndex,
  originalFontFamily, translationFontFamily,
}) {
  let columns = columnNames.map((_name) => {
    const name = _name?.trim();
    const { options, ...props } = columnsMap[name] || {};
    const { filterOptions: customFilterOptions, ...customOptions } = options || {};
    const offset = rowHeader ? 1 : 0;
    let filterOptions;

    if (columnsFilter.includes(name)) {
      filterOptions = {
        logic: (value, filters) => filterLogic({
          value, filters, delimiters,
        }),
        display: (filterList, onChange, filterIndex, column) => (
          filterDisplay({
            filterList, onChange, column, offset, columnsFilterOptions, filterIndex,
          })
        ),
        ...customFilterOptions
      };
    };
    return {
      name,
      searchable: true,
      options: {
        display: columnsShow.includes(name),
        filter: columnsFilter.includes(name),
        filterType: columnsFilter.includes(name) ? 'custom' : undefined,
        filterOptions,
        customBodyRender:(value, tableMeta) => {
          const { tableState = {} } = tableMeta;
          const { rowsPerPage, page } = tableState || {};
          const cellProps = {
            generateRowId, value, tableMeta, onEdit: cellEdit, delimiters, rowsPerPage, page, preview, columnsFilterOptions, originalFontFamily, translationFontFamily,
          };
          return <Cell {...cellProps} />;
        },
        customFilterListOptions: { render: (value) => (`${name} - ${value}`) },
        ...customOptions
      },
      ...props
    };
  });

  if (rowHeader) {
    const headerColumn = {
      name: 'rowHeader',
      options: {
        filter: false,
        customBodyRender:(_, tableMeta) => {
          const cellProps = {
            generateRowId, tableMeta, delimiters, rowHeader, scrollToIndex
          };
          return <HeaderCell {...cellProps} />;
        },
      },
    };
    columns.unshift(headerColumn);
  }
  return columns;
}

export function getData({
  data, columnNames, rowHeader,
}) {
  let _data = [...data];

  if (columnNames && data && rowHeader) {
    _data = data.map(row => ['rowHeader', ...row]);
  }
  return _data;
}
