/** A product recommended on a site survey, picked from the catalog. */
export interface SurveyProduct {
  product_id: string | null;
  product_name: string;
  product_specs: string;
  quantity: number;
}
