import { useState, useEffect } from 'react';
import Select, { components } from 'react-select';

const CustomOption = (props) => {
  return (
    <components.Option {...props}>
      {/* <img
        src={props.data.logo}
        style={{ width: '40px', marginRight: '10px' }}
        alt={props.data.label}
      />
      {props.data.label} */}
      <div className="flex items-center space-x-4">
        <img src={props.data.logo} alt={''} className="h-8 w-8 object-contain" />
        <div className="tracking-wide text-sm text-indigo-500 font-semibold">{props.data.label}</div>
      </div>
    </components.Option>
  );
};

export default function Filter({ onFilterChange, supabase }) {
  const [companyOptions, setCompanyOptions] = useState([]);
  const [selectedCompanies, setSelectedCompanies] = useState([]);

  const handleOptionsChange = async (selectedOptions) => {
    const selectedValues = selectedOptions.map(option => option.value);
    setSelectedCompanies(selectedValues);
    onFilterChange(selectedValues.sort());
  };

  useEffect(() => {
    const fetchCompanies = async () => {
      let { data: companies, error } = await supabase
        .from('links')
        .select('company, logo_url') // Fetch the logo URL as well
        .order('company', { ascending: true });

      if (error) {
        console.error('Error fetching companies:', error);
        return;
      }

      // Include the logo URL in the formatted options
      const formattedCompanies = companies.map(company => ({
        value: company.company,
        label: company.company,
        logo: company.logo_url // Assuming 'logoUrl' is the field name for logo URLs in your database
      }));
      setCompanyOptions(formattedCompanies);
    };

    fetchCompanies();
  }, []);

  return (
    <div className="flex justify-center mt-4 mb-2 md:mt-6 mb-4">
      <Select
        instanceId="filter"
        options={companyOptions}
        onChange={handleOptionsChange}
        isMulti
        closeMenuOnSelect={false}
        controlShouldRenderValue={false}
        hideSelectedOptions={false}
        placeholder={selectedCompanies.length === 0 ? 'filter by company' : selectedCompanies.length === 1 ? `${selectedCompanies.length} company selected` : `${selectedCompanies.length} companies selected`}
        components={{ Option: CustomOption }}
      />
    </div>
  );
}
