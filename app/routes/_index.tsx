import { ActionFunctionArgs, json, type MetaFunction } from "@remix-run/node";
import { z } from "zod";
import { withZod } from "@rvf/zod";
import { useForm, validationError } from "@rvf/remix";
import { useLoaderData } from "@remix-run/react";

export const meta: MetaFunction = () => {
  return [
    { title: "When TypeScript Goes Too Far!" },
    { name: "description", content: "Lessons learned in the wilds of TS" },
  ];
};

function getZodSchemaForCustomField(field: CustomField) {
  switch (field.type) {
    case "text":
    case "select":
      return z.string();
    case "number":
      return z.number();
  }
}

const schema = z.object({
  name: z.string(),
  date: z.date({ coerce: true }),
  individual: z.string(),
});

type CustomField = {
  name: string;
  label: string;
  type: "text" | "number" | "select";
  options?: { label: string; value: string }[];
};

interface CustomFieldInputsProps {
  fields: CustomField[];
}
function CustomFieldInputs({ fields }: CustomFieldInputsProps) {
  const input = (field: CustomField) => {
    switch (field.type) {
      case "text":
        return <input name={field.name} id={field.name} type="text" />;
      case "number":
        return <input name={field.name} id={field.name} type="number" />;
      case "select":
        return (
          <select name={field.name} id={field.name}>
            {field.options?.map((option) => (
              <option
                value={option.value}
                key={`${field.name}-option-${option.label}`}
              >
                {option.label}
              </option>
            ))}
          </select>
        );
    }
  };

  return (
    <>
      {fields.map((field) => {
        return (
          <div className="flex flex-col" key={field.name}>
            <label htmlFor={field.name}>{field.label}</label>
            {input(field)}
          </div>
        );
      })}
    </>
  );
}

const customFields: CustomField[] = [
  {
    name: "trial_category",
    label: "Trial Category",
    type: "select",
    options: [
      { label: "Calibration", value: "calibration" },
      { label: "Data", value: "data" },
    ],
  },
  {
    name: "trial_comment",
    label: "Trial comment",
    type: "text",
  },
];

export const action = async ({ request }: ActionFunctionArgs) => {
  const validator = withZod(
    schema.extend(
      customFields.reduce(
        (customFieldsSchema, field) => ({
          [field.name]: getZodSchemaForCustomField(field),
          ...customFieldsSchema,
        }),
        {}
      )
    )
  );

  const { error, data } = await validator.validate(await request.formData());

  if (error) {
    // Throw a server error here.
    throw validationError(error);
  }

  const { name, date, individual, ...otherFields } = data;

  console.log("DATA:", name, date, individual, otherFields);

  return null;
};

export const loader = async () => {
  return json({ customFields });
};

export default function Index() {
  const { customFields } = useLoaderData<typeof loader>();

  const validator = withZod(
    schema.extend(
      customFields.reduce(
        (customFieldsSchema, field) => ({
          [field.name]: getZodSchemaForCustomField(field),
          ...customFieldsSchema,
        }),
        {}
      )
    )
  );

  const form = useForm({ validator, method: "POST" });

  console.log("Form errors:", form.formState.fieldErrors);

  return (
    <div className="flex flex-col h-screen items-center justify-center">
      <h1>Create new trial</h1>
      <form {...form.getFormProps()}>
        <div className="flex flex-col">
          <label htmlFor="name">Trial name</label>
          <input id="name" name="name" type="text" />
        </div>
        <div className="flex flex-col">
          <label htmlFor="date">Trial date</label>
          <input id="date" name="date" type="date" />
        </div>
        <div className="flex flex-col">
          <label htmlFor="individual">Trial individual</label>
          <select id="individual" name="individual">
            <option>A</option>
            <option>B</option>
            <option>C</option>
          </select>
        </div>
        {/*  */}
        <CustomFieldInputs fields={customFields} />
        <button type="submit">Create</button>
      </form>
    </div>
  );
}
