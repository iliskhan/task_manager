import FilterListOutlined from '@mui/icons-material/FilterListOutlined';
import Search from '@mui/icons-material/Search';
import SortOutlined from '@mui/icons-material/SortOutlined';
import { Box, InputAdornment, MenuItem, Select, TextField } from '@mui/material';
import type { ProjectSortKey, ProjectStatusFilter } from './projectTypes';

type ProjectListControlsProps = {
  search: string;
  statusFilter: ProjectStatusFilter;
  sortKey: ProjectSortKey;
  onSearchChange: (value: string) => void;
  onStatusFilterChange: (value: ProjectStatusFilter) => void;
  onSortKeyChange: (value: ProjectSortKey) => void;
};

export function ProjectListControls({
  search,
  statusFilter,
  sortKey,
  onSearchChange,
  onStatusFilterChange,
  onSortKeyChange,
}: ProjectListControlsProps) {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: {
          xs: '1fr',
          md: 'minmax(280px, 330px) 1fr auto auto',
        },
        gap: 2,
        alignItems: 'center',
      }}
    >
      <TextField
        label="Поиск проектов"
        value={search}
        onChange={(event) => onSearchChange(event.target.value)}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
          },
        }}
      />
      <Box />
      <Select
        value={statusFilter}
        inputProps={{ 'aria-label': 'Фильтр проектов' }}
        startAdornment={<FilterListOutlined sx={{ mr: 1.2 }} />}
        onChange={(event) => onStatusFilterChange(event.target.value as ProjectStatusFilter)}
        sx={{ minWidth: { xs: '100%', md: 232 } }}
      >
        <MenuItem value="active">Активные</MenuItem>
        <MenuItem value="archived">Архивные</MenuItem>
        <MenuItem value="all">Все проекты</MenuItem>
      </Select>
      <Select
        value={sortKey}
        inputProps={{ 'aria-label': 'Сортировка проектов' }}
        startAdornment={<SortOutlined sx={{ mr: 1.2 }} />}
        onChange={(event) => onSortKeyChange(event.target.value as ProjectSortKey)}
        sx={{ minWidth: { xs: '100%', md: 220 } }}
      >
        <MenuItem value="deadline">По дедлайну</MenuItem>
        <MenuItem value="progress">По прогрессу</MenuItem>
        <MenuItem value="lastVisit">По посещению</MenuItem>
        <MenuItem value="createdAt">По созданию</MenuItem>
      </Select>
    </Box>
  );
}
