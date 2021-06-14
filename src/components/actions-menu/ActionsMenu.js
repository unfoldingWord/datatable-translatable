import React, { useContext } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { IconButton , Tooltip } from '@material-ui/core';
import isEqual from 'lodash.isequal';
import {
  ArrowDropDownCircleOutlined,
  AddCircleOutline,
  RemoveCircleOutline,
} from '@material-ui/icons';


import { DataTableContext } from '../datatable/DataTable.context';
import { localString } from '../../core/localStrings';
import AddRow from './AddRow';
import DeleteRow from './DeleteRow';


function RowMenu({
  rowIndex,
  rowData,
  delimiters,
  generateRowId,
}) {
  const classes = useStyles();
  const { state, actions } = useContext(DataTableContext);
  const { columnNames } = state;
  const {
    rowGenerate,
    rowAddBelow,
    rowDelete,
    rowMoveAbove,
    rowMoveBelow,
  } = actions;
  const handleMoveAbove = () => rowMoveAbove({ rowIndex });
  const handleMoveBelow = () => rowMoveBelow({ rowIndex });

  const disableMoveAbove = rowIndex === 0;

  const addRowButton = (
    <Tooltip title={localString('AddRow')} arrow>
      <IconButton className={classes.button}>
        <AddCircleOutline />
      </IconButton>
    </Tooltip>
  );
  const deleteRowButton = (
    <Tooltip title={localString('DeleteRow')} arrow>
      <IconButton className={classes.button}>
        <RemoveCircleOutline />
      </IconButton>
    </Tooltip>
  );

  return (
    <div className={classes.root}>
      <Tooltip title={localString('MoveRowUp')} arrow>
        <div>
          <IconButton className={classes.flipY} disabled={disableMoveAbove} onClick={handleMoveAbove}>
            <ArrowDropDownCircleOutlined />
          </IconButton>
        </div>
      </Tooltip>
      <AddRow
        rowData={rowData}
        rowIndex={rowIndex}
        columnNames={columnNames}
        rowGenerate={rowGenerate}
        rowAddBelow={rowAddBelow}
        button={addRowButton}
        generateRowId={generateRowId}
      />
      <DeleteRow
        rowData={rowData}
        rowIndex={rowIndex}
        columnNames={columnNames}
        rowDelete={rowDelete}
        delimiters={delimiters}
        button={deleteRowButton}
        generateRowId={generateRowId}
      />
      <Tooltip title={localString('MoveRowDown')} arrow>
        <IconButton className={classes.button} onClick={handleMoveBelow}>
          <ArrowDropDownCircleOutlined />
        </IconButton>
      </Tooltip>
    </div>
  );
}

const useStyles = makeStyles(theme => ({
  root: {
    display: 'flex',
    justifyContent: 'flex-end',
  },
  flipY: {
    transform: 'scaleY(-1)',
    padding: '8px',
  },
  button: { padding: '8px' },
}));

export default React.memo(RowMenu, (prevProps, nextProps) => prevProps.rowIndex === nextProps.rowIndex &&
  isEqual(prevProps.rowData, nextProps.rowData) &&
  isEqual(prevProps.delimiters, nextProps.delimiters),
);